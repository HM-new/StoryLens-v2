import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { PhaseKey, Story } from '../lib/types';
import PhaseChat from './PhaseChat';
import Phase6Gallery from './Phase6Gallery';

const PHASES: { key: PhaseKey; label: string }[] = [
  { key: 'phase1', label: 'Phase 1 — Research (News Story Document)' },
  { key: 'phase2', label: 'Phase 2 — Calibrate (age + length)' },
  { key: 'phase3', label: 'Phase 3 — Narrative Style' },
  { key: 'phase5a', label: 'Phase 5A — Comic Script' },
  { key: 'phase5b', label: 'Phase 5B — OpenAI Image Playbook' },
  { key: 'phase6', label: 'Phase 6 — Image Generation' },
];

export default function AdminStory() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PhaseKey>('phase1');

  const load = async () => {
    if (!id) return;
    try {
      setStory(await api.adminGetStory(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    void load();
    const i = setInterval(load, 2500);
    return () => clearInterval(i);
  }, [id]);

  if (!id) return null;
  if (error) return <div className="admin-error">{error}</div>;
  if (!story) return <div className="admin-empty">Loading…</div>;

  return (
    <div className="admin-story">
      <header className="admin-header">
        <div>
          <Link to="/" className="admin-back">← All stories</Link>
          <h1 className="admin-title">{story.selections.topic || '(no topic)'}</h1>
          <p className="admin-subtitle">
            {story.id} · created {new Date(story.createdAt).toLocaleString()}
          </p>
        </div>
        <a href="/" className="admin-link-btn">Kid app →</a>
      </header>

      <section className="admin-selections">
        <Field label="Topic">{story.selections.topic}</Field>
        <Field label="Age band">{story.selections.ageBand}</Field>
        <Field label="Length">{story.selections.length}</Field>
        <Field label="Narrative">{story.selections.narrativeStyle}</Field>
        <Field label="Persona">{story.selections.persona?.name}</Field>
        <Field label="Visual style">{story.selections.visualStyleId}</Field>
        <Field label="Mode">{story.mode}</Field>
        <Field label="Status">{story.status}</Field>
      </section>

      <nav className="admin-tabs">
        {PHASES.map((p) => {
          const state = story.phases[p.key];
          return (
            <button
              key={p.key}
              className={`admin-tab admin-tab-${state?.status ?? 'pending'} ${activeTab === p.key ? 'active' : ''}`}
              onClick={() => setActiveTab(p.key)}
            >
              <div className="admin-tab-label">{p.label.split(' — ')[0]}</div>
              <div className="admin-tab-sub">{state?.status ?? 'pending'}</div>
            </button>
          );
        })}
      </nav>

      <section className="admin-phase-pane">
        {(() => {
          const p = PHASES.find((x) => x.key === activeTab)!;
          const state = story.phases[p.key];
          if (!state) {
            return (
              <div className="phase-empty">
                {p.label} hasn&apos;t started yet. In v1 only Phase 1 is wired — pick a topic on the kid app.
              </div>
            );
          }
          if (p.key === 'phase6') {
            return (
              <Phase6Gallery
                story={story}
                state={state}
                onApprove={async () => {
                  await api.adminApprove(id, p.key);
                  await load();
                }}
                onRestart={async () => {
                  await api.adminRestart(id, p.key);
                  await load();
                }}
                onReload={load}
              />
            );
          }
          return (
            <PhaseChat
              phaseKey={p.key}
              phaseLabel={p.label}
              state={state}
              onApprove={async () => {
                await api.adminApprove(id, p.key);
                await load();
              }}
              onRestart={async () => {
                await api.adminRestart(id, p.key);
                await load();
              }}
              onRefine={async (msg) => {
                await api.adminRefine(id, p.key, msg);
                await load();
              }}
              onAcceptProposal={async () => {
                await api.adminAcceptProposal(id, p.key);
                await load();
              }}
              onRejectProposal={async () => {
                await api.adminRejectProposal(id, p.key);
                await load();
              }}
            />
          );
        })()}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="admin-field">
      <div className="admin-field-label">{label}</div>
      <div className="admin-field-value">{children || <span className="admin-empty-value">—</span>}</div>
    </div>
  );
}
