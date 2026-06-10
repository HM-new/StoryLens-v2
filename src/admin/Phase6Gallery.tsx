import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { PhaseState, Story } from '../lib/types';

interface Props {
  story: Story;
  state: PhaseState;
  onRestart: () => Promise<void>;
  onApprove: () => Promise<void>;
  onReload: () => Promise<void>;
}

interface ImageItem {
  filename: string;
  url: string;
  label: string;
}

function collectImages(story: Story): ImageItem[] {
  const items: ImageItem[] = [];
  const cover = story.artifacts?.cover;
  if (cover) items.push({ filename: 'cover.png', url: cover, label: 'Cover' });
  const pages = (story.artifacts?.pages || []).slice().sort((a, b) => a.num - b.num);
  for (const p of pages) {
    const filename = (p.url.split('/').pop() || `page_${p.num}.png`).split('?')[0];
    items.push({ filename, url: p.url, label: `Page ${p.num - 1}` });
  }
  return items;
}

export default function Phase6Gallery({ story, state, onRestart, onApprove, onReload }: Props) {
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cascadeMessage, setCascadeMessage] = useState('');
  const [cascading, setCascading] = useState(false);

  const images = collectImages(story);

  // Detect cascade in flight: 5B or 6 reverted to pending/running while 5A is approved with new artifact
  const p5a = story.phases.phase5a;
  const p5b = story.phases.phase5b;
  const p6 = story.phases.phase6;
  const cascadeInFlight =
    cascading ||
    (p5a?.status === 'approved' &&
      (p5b?.status === 'running' || p5b?.status === 'pending' ||
       p6?.status === 'running' || p6?.status === 'pending'));

  // Reset local "cascading" once the backend has caught up and produced a fresh artifact
  useEffect(() => {
    if (cascading && p6?.status === 'awaiting-review' && (story.artifacts?.cover || (story.artifacts?.pages || []).length > 0)) {
      setCascading(false);
    }
    if (cascading && p6?.status === 'error') setCascading(false);
  }, [cascading, p6?.status, story.artifacts?.cover, story.artifacts?.pages]);

  // Helpful label for what step the cascade is on
  let cascadeStage = '';
  if (cascadeInFlight) {
    if (p5b?.status === 'running') cascadeStage = 'Refining script + regenerating playbook…';
    else if (p6?.status === 'pending') cascadeStage = 'Playbook ready — preparing image generation…';
    else if (p6?.status === 'running') {
      const done = (story.artifacts?.pages || []).length + (story.artifacts?.cover ? 1 : 0);
      cascadeStage = `Regenerating images: ${done}/${images.length || '?'} done`;
    } else cascadeStage = 'Working on the script refinement…';
  }

  let manifest: { totalPrompts?: number; generated?: number; failures?: { title: string; error: string }[] } = {};
  if (state.artifact) {
    try { manifest = JSON.parse(state.artifact); } catch { /* ignore */ }
  }

  const submitCascade = async () => {
    if (!cascadeMessage.trim() || cascading) return;
    if (!confirm(
      'This will:\n\n1. Refine the comic script with your feedback (~$0.10)\n' +
        '2. Regenerate the playbook (~$0.10)\n3. Regenerate ALL ' +
        images.length +
        ' images (~$' +
        (images.length * 0.04).toFixed(2) +
        ')\n\nTotal: ~$' +
        (0.2 + images.length * 0.04).toFixed(2) +
        '. Proceed?'
    )) return;
    setCascading(true);
    setErr(null);
    try {
      await api.adminCascadeRefine(story.id, 'phase5a', cascadeMessage.trim());
      setCascadeMessage('');
      // Polling in AdminStory will pick up the running phases
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setCascading(false);
    }
  };

  const regenerate = async (filename: string) => {
    setRegenerating(filename);
    setErr(null);
    try {
      // Cache-bust the image URL
      await api.adminRegeneratePage(story.id, filename);
      await onReload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="phase-chat">
      <div className="phase-chat-meta">
        <div>
          <strong>Phase 6 — Image Generation</strong> —{' '}
          <span className={`phase-status phase-status-${state.status}`}>{state.status}</span>
        </div>
        <div className="phase-chat-stats">
          {state.durationMs ? `${(state.durationMs / 1000).toFixed(1)}s` : ''}
          {state.inputTokens != null && state.outputTokens != null
            ? ` · ${state.inputTokens} in / ${state.outputTokens} out`
            : ''}
          {manifest.totalPrompts != null
            ? ` · ${manifest.generated ?? images.length}/${manifest.totalPrompts} generated`
            : ` · ${images.length} images`}
        </div>
      </div>

      {state.error && <div className="admin-error">{state.error}</div>}
      {err && <div className="admin-error">{err}</div>}

      {state.status === 'running' && (
        <div className="phase-loading">
          Generating images… {images.length} done so far. Page lands here as each completes.
        </div>
      )}

      <div className="phase-artifact-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>🖼️ Generated images ({images.length})</span>
        <span>
          <a
            href={`/?storyId=${story.id}&go=reader`}
            target="_blank"
            rel="noreferrer"
            style={{ marginRight: 12, color: '#0891B2', fontSize: 12, textDecoration: 'none' }}
          >
            Open in Reader →
          </a>
        </span>
      </div>

      {images.length === 0 ? (
        <div className="phase-empty">No images yet.</div>
      ) : (
        <div className="phase6-grid">
          {images.map((img) => (
            <div key={img.filename} className="phase6-tile">
              <a href={img.url} target="_blank" rel="noreferrer" className="phase6-tile-img-wrap">
                <img src={img.url} alt={img.label} className="phase6-tile-img" />
              </a>
              <div className="phase6-tile-meta">
                <span className="phase6-tile-label">{img.label}</span>
                <span className="phase6-tile-file">{img.filename}</span>
              </div>
              <button
                onClick={() => void regenerate(img.filename)}
                disabled={regenerating !== null}
                className="phase6-regen-btn"
              >
                {regenerating === img.filename ? 'Regenerating…' : '↻ Regenerate'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── Cascade refine: edit script + regenerate all ─── */}
      <details className="cascade-panel" open={cascadeInFlight}>
        <summary>✏️ Refine the comic script &amp; regenerate everything</summary>
        <p style={{ fontSize: 12, color: '#475569', margin: '8px 0' }}>
          Spotted a script-level issue in the images? Tell Gemini what to change, and it'll refine the script,
          regenerate the playbook, and re-create all images automatically. No per-phase review gate.
        </p>
        <textarea
          value={cascadeMessage}
          onChange={(e) => setCascadeMessage(e.target.value)}
          placeholder="e.g. 'On Page 2, label Advocate Zahra and Director-General Aris as composite characters. On Page 4, introduce proxy groups earlier in the story before the term is used.'"
          rows={4}
          disabled={cascading || cascadeInFlight}
        />
        <div className="phase-chat-actions" style={{ marginTop: 8 }}>
          <button
            onClick={() => void submitCascade()}
            disabled={!cascadeMessage.trim() || cascading || cascadeInFlight}
            className="btn-primary"
          >
            {cascading || cascadeInFlight ? cascadeStage || 'Working…' : 'Refine script + regenerate all'}
          </button>
        </div>
        {cascadeInFlight && (
          <div className="phase-loading" style={{ marginTop: 10 }}>
            {cascadeStage} — this takes ~3-5 minutes total. Images will refresh in the grid above as they land.
          </div>
        )}
      </details>

      {manifest.failures && manifest.failures.length > 0 && (
        <details className="phase-tool-log" style={{ marginTop: 12 }}>
          <summary>Failed pages ({manifest.failures.length})</summary>
          <ul>
            {manifest.failures.map((f, i) => (
              <li key={i}>
                <strong>{f.title}</strong>: <code>{(f.error || '').slice(0, 200)}</code>
              </li>
            ))}
          </ul>
        </details>
      )}

      {state.status === 'awaiting-review' && (
        <div className="phase-chat-actions" style={{ marginTop: 16 }}>
          <button onClick={() => void onApprove()} className="btn-approve">
            ✓ Approve all (mark phase done)
          </button>
          <button
            onClick={() => {
              if (confirm('Wipe all images and re-run Phase 6 from scratch?')) void onRestart();
            }}
            className="btn-danger"
            disabled={regenerating !== null}
          >
            ↺ Re-run whole phase
          </button>
        </div>
      )}

      {state.status === 'approved' && (
        <div className="phase-approved-note">✓ Approved — comic ready in Reader.</div>
      )}
    </div>
  );
}
