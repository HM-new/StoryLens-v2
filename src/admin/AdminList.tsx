import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Story } from '../lib/types';

const STATUS_COLOR: Record<string, string> = {
  draft: '#94a3b8',
  researching: '#0891B2',
  calibrating: '#0891B2',
  'styling-narrative': '#0891B2',
  scripting: '#0891B2',
  'building-playbook': '#0891B2',
  'generating-images': '#0891B2',
  ready: '#22C55E',
  error: '#ef4444',
};

export default function AdminList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const all = await api.adminListStories();
      setStories(all);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="admin-list">
      <header className="admin-header">
        <div>
          <h1 className="admin-title">StoryLens Studio</h1>
          <p className="admin-subtitle">QA each phase before it ships to the comic.</p>
        </div>
        <a href="/" className="admin-link-btn">
          Kid app →
        </a>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-empty">Loading stories…</div>
      ) : stories.length === 0 ? (
        <div className="admin-empty">
          No stories yet. Go to the kid app, submit a topic, and it&apos;ll appear here.
        </div>
      ) : (
        <ul className="admin-story-list">
          {stories.map((s) => {
            const phaseCount = Object.values(s.phases).filter((p) => p?.status === 'approved').length;
            return (
              <li key={s.id}>
                <Link to={`/stories/${s.id}`} className="admin-story-card">
                  <div className="admin-story-topic">{s.selections.topic || '(no topic)'}</div>
                  <div className="admin-story-meta">
                    <span
                      className="admin-status-pill"
                      style={{ background: STATUS_COLOR[s.status] || '#94a3b8' }}
                    >
                      {s.status}
                    </span>
                    <span>{s.selections.ageBand ?? '—'}</span>
                    <span>{s.selections.length ?? '—'}</span>
                    <span>{s.selections.narrativeStyle ?? '—'}</span>
                    <span>{s.selections.visualStyleId ?? '—'}</span>
                    <span>{phaseCount}/6 phases approved</span>
                  </div>
                  <div className="admin-story-time">
                    {new Date(s.createdAt).toLocaleString()}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
