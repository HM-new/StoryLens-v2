import type { Story } from './types';

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}
async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  ping: () => get<{ ok: true }>('/api/ping'),

  // Kid flow
  createStory: (topic: string, sources?: string[]) =>
    send<{ storyId: string; warning?: string }>('/api/stories', 'POST', { topic, sources }),
  updateSelections: (id: string, patch: Partial<Story['selections']>) =>
    send<{ ok: true }>(`/api/stories/${id}`, 'PATCH', patch),
  getStory: (id: string) => get<Story>(`/api/stories/${id}`),

  // Admin
  adminListStories: () => get<Story[]>('/api/admin/stories'),
  adminGetStory: (id: string) => get<Story>(`/api/admin/stories/${id}`),
  adminApprove: (id: string, phase: string) =>
    send<{ ok: true }>(`/api/admin/stories/${id}/phases/${phase}/approve`, 'POST'),
  adminRestart: (id: string, phase: string) =>
    send<{ ok: true }>(`/api/admin/stories/${id}/phases/${phase}/restart`, 'POST'),
  adminRefine: (id: string, phase: string, message: string) =>
    send<{ ok: true }>(`/api/admin/stories/${id}/phases/${phase}/refine`, 'POST', { message }),
  adminAcceptProposal: (id: string, phase: string) =>
    send<{ ok: true }>(`/api/admin/stories/${id}/phases/${phase}/accept-proposal`, 'POST'),
  adminRejectProposal: (id: string, phase: string) =>
    send<{ ok: true }>(`/api/admin/stories/${id}/phases/${phase}/reject-proposal`, 'POST'),
  adminRegeneratePage: (id: string, filename: string) =>
    send<{ ok: true; filename: string; bytes: number }>(
      `/api/admin/stories/${id}/phases/phase6/regenerate-page`,
      'POST',
      { filename }
    ),
  adminCascadeRefine: (id: string, fromPhase: 'phase5a', message: string) =>
    send<{ ok: true; message: string }>(`/api/admin/stories/${id}/cascade-refine`, 'POST', {
      fromPhase,
      message,
    }),
};
