import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { PhaseState, ChatMessage } from '../lib/types';
import DiffView from './DiffView';

interface Props {
  phaseKey: string;
  phaseLabel: string;
  state: PhaseState;
  onApprove: () => Promise<void>;
  onRestart: () => Promise<void>;
  onRefine: (message: string) => Promise<void>;
  onAcceptProposal: () => Promise<void>;
  onRejectProposal: () => Promise<void>;
}

export default function PhaseChat({
  phaseKey,
  phaseLabel,
  state,
  onApprove,
  onRestart,
  onRefine,
  onAcceptProposal,
  onRejectProposal,
}: Props) {
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasProposal = !!state.proposedArtifact;

  const sendFeedback = async () => {
    if (!feedback.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onRefine(feedback.trim());
      setFeedback('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const click = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await action();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  // Hide the initial substituted prompt (the giant first user message).
  // Show only the back-and-forth refinement turns from index 2 onward.
  const initialAssistantIdx = state.chat.findIndex((m) => m.role === 'assistant');
  const refinementHistory: ChatMessage[] =
    initialAssistantIdx >= 0 ? state.chat.slice(initialAssistantIdx + 1) : [];

  return (
    <div className="phase-chat">
      <div className="phase-chat-meta">
        <div>
          <strong>{phaseLabel}</strong> —{' '}
          <span className={`phase-status phase-status-${state.status}`}>{state.status}</span>
        </div>
        <div className="phase-chat-stats">
          {state.durationMs ? `${(state.durationMs / 1000).toFixed(1)}s` : ''}
          {state.inputTokens != null && state.outputTokens != null
            ? ` · ${state.inputTokens} in / ${state.outputTokens} out`
            : ''}
          {state.toolCalls?.length ? ` · ${state.toolCalls.length} tool calls` : ''}
        </div>
      </div>

      {state.toolCalls && state.toolCalls.length > 0 && (
        <details className="phase-tool-log">
          <summary>Research log ({state.toolCalls.length})</summary>
          <ul>
            {state.toolCalls.map((t, i) => (
              <li key={i}>
                <code>{t.tool}</code> · {t.detail}
              </li>
            ))}
          </ul>
        </details>
      )}

      {state.status === 'error' && state.error && (
        <div className="admin-error">{state.error}</div>
      )}

      {state.status === 'running' && (
        <div className="phase-loading">
          Working… {phaseKey === 'phase1' ? 'Gemini is searching the web.' : 'Gemini is generating.'}
        </div>
      )}

      {/* ─── PROPOSAL REVIEW (Canvas-like) ─── */}
      {hasProposal && state.artifact && (
        <div className="proposal-pane">
          <div className="proposal-pane-header">⚡ Pending change — review before applying</div>
          {state.proposalNote && <div className="proposal-plan">{state.proposalNote}</div>}
          <DiffView before={state.artifact} after={state.proposedArtifact!} />
          <div className="proposal-actions">
            <button
              onClick={() => void click(onAcceptProposal)}
              disabled={busy}
              className="btn-accept"
            >
              ✓ Accept changes
            </button>
            <button
              onClick={() => void click(onRejectProposal)}
              disabled={busy}
              className="btn-reject"
            >
              ✕ Reject — keep current
            </button>
          </div>
          {err && <div className="admin-error" style={{ marginTop: 10 }}>{err}</div>}
        </div>
      )}

      {/* ─── INITIAL PROPOSAL (no canonical yet — proposal IS the artifact) ─── */}
      {hasProposal && !state.artifact && (
        <div className="proposal-pane">
          <div className="proposal-pane-header">⚡ Pending change — no prior artifact to diff against</div>
          {state.proposalNote && <div className="proposal-plan">{state.proposalNote}</div>}
          <article className="phase-artifact-body" style={{ background: 'white', borderRadius: 4 }}>
            <ReactMarkdown>{state.proposedArtifact!}</ReactMarkdown>
          </article>
          <div className="proposal-actions">
            <button onClick={() => void click(onAcceptProposal)} disabled={busy} className="btn-accept">
              ✓ Accept
            </button>
            <button onClick={() => void click(onRejectProposal)} disabled={busy} className="btn-reject">
              ✕ Reject
            </button>
          </div>
        </div>
      )}

      {/* ─── CANONICAL ARTIFACT (only show when there's no pending proposal) ─── */}
      {!hasProposal && state.artifact ? (
        <div className="phase-artifact">
          <div className="phase-artifact-header">
            <span>📄 Current artifact</span>
          </div>
          <article className="phase-artifact-body">
            <ReactMarkdown>{state.artifact}</ReactMarkdown>
          </article>
        </div>
      ) : !hasProposal && state.status === 'pending' ? (
        <div className="phase-empty">Phase hasn&apos;t started yet.</div>
      ) : null}

      {/* ─── REFINEMENT HISTORY ─── */}
      {refinementHistory.length > 0 && (
        <div className="phase-refinement-history">
          <h4>Refinement history</h4>
          {refinementHistory.map((m, i) => (
            <div key={i} className={`phase-msg phase-msg-${m.role}`}>
              <div className="phase-msg-role">{m.role === 'user' ? 'You' : 'Claude'}</div>
              <div className="phase-msg-body">
                {m.role === 'user' ? (
                  // Strip the canvas wrapping instructions for display
                  m.content.split('IMPORTANT — output format')[0].trim()
                ) : (
                  <em>Regenerated artifact ({m.content.length.toLocaleString()} chars)</em>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── REFINEMENT INPUT (disabled while a proposal is pending) ─── */}
      {state.status === 'awaiting-review' && (
        <div className="phase-chat-input">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={
              hasProposal
                ? 'Accept or reject the pending change before requesting another refinement.'
                : "Tell Gemini what to change. e.g. 'Section 7 is too US-centric — add an Iranian-aligned source.'"
            }
            rows={3}
            disabled={busy || hasProposal}
          />
          <div className="phase-chat-actions">
            <button
              onClick={sendFeedback}
              disabled={busy || !feedback.trim() || hasProposal}
              className="btn-primary"
            >
              {busy ? 'Working…' : 'Refine'}
            </button>
            <button
              onClick={() => void click(onApprove)}
              disabled={busy || hasProposal}
              className="btn-approve"
            >
              ✓ Approve &amp; continue
            </button>
            <button
              onClick={() => {
                if (confirm('Wipe this phase and re-run from scratch?')) void click(onRestart);
              }}
              disabled={busy}
              className="btn-danger"
            >
              ↺ Re-run from scratch
            </button>
          </div>
        </div>
      )}

      {state.status === 'approved' && (
        <div className="phase-approved-note">✓ Approved — downstream phases can now use this.</div>
      )}

      {err && !hasProposal && <div className="admin-error">{err}</div>}
    </div>
  );
}
