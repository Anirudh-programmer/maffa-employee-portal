// services/api.js — single thin layer on top of fetch(), wired to /maffa/*
const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/maffa';
export const API_BASE = RAW_BASE.replace(/\/$/, '');

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      detail = j.detail || detail;
    } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

// ── Employees ────────────────────────────────────────────────
export const EmployeesAPI = {
  list:           (params = {})      => request(`/employees${qs(params)}`),
  get:            (id)               => request(`/employees/${id}`),
  setRecogPref:   (id, preference)   => request(`/employees/${id}/recognition-preference`, { method: 'PUT', body: { preference } }),
  setNotifyPrefs: (id, prefs)        => request(`/employees/${id}/notification-preferences`, { method: 'PUT', body: prefs }),
  validation:     ()                 => request(`/employees/validation-report`),
};

// ── Engagement Events ────────────────────────────────────────
export const EventsAPI = {
  list:     (params = {})           => request(`/events${qs(params)}`),
  get:      (id)                    => request(`/events/${id}`),
  create:   (payload)               => request(`/events`, { method: 'POST', body: payload }),
  register: (id, employee_id)       => request(`/events/${id}/register`, { method: 'POST', body: { employee_id } }),
};

// ── Surveys ──────────────────────────────────────────────────
export const SurveysAPI = {
  list:         (params = {})                    => request(`/surveys${qs(params)}`),
  get:          (id)                             => request(`/surveys/${id}`),
  active:       (employee_id)                    => request(`/surveys/active${qs({ employee_id })}`),
  create:       (payload)                        => request(`/surveys`, { method: 'POST', body: payload }),
  submit:       (id, employee_id, answers)       => request(`/surveys/${id}/submit`, { method: 'POST', body: { employee_id, answers } }),
};

// ── Knowledge Base ───────────────────────────────────────────
export const KBAPI = {
  articles:   (params = {})              => request(`/knowledge_base/articles${qs(params)}`),
  article:    (id)                       => request(`/knowledge_base/articles/${id}`),
  query:      (employee_id, query_text)  => request(`/knowledge_base/query`, { method: 'POST', body: { employee_id, query_text } }),
  queries:    (params = {})              => request(`/knowledge_base/queries${qs(params)}`),
};

// ── Escalations (HR Expert Queue) ────────────────────────────
export const EscalationsAPI = {
  list:    (params = {})        => request(`/escalations${qs(params)}`),
  stats:   ()                   => request(`/escalations/stats`),
  resolve: (id, action, body)   => request(`/escalations/${id}`, { method: 'PUT', body: { action, ...(body || {}) } }),
};

// ── Approvals ────────────────────────────────────────────────
export const ApprovalsAPI = {
  list:           (params = {})                => request(`/approvals${qs(params)}`),
  stats:          ()                           => request(`/approvals/stats`),
  decide:         (id, decision, comments)     => request(`/approvals/${id}`, { method: 'PUT', body: { decision, comments } }),
  escalateBreached: ()                         => request(`/approvals/escalate-breached`, { method: 'POST', body: {} }),
};

// ── Recognition ──────────────────────────────────────────────
export const RecognitionAPI = {
  templates:    (params = {})                  => request(`/templates${qs(params)}`),
  createTemplate: (payload)                    => request(`/templates`, { method: 'POST', body: payload }),
  resubmit:     (id)                           => request(`/templates/${id}/resubmit`, { method: 'POST', body: {} }),
  runCycle:     (target_date = null)           => request(`/recognition/run-cycle`, { method: 'POST', body: target_date ? { target_date } : {} }),
  log:          (params = {})                  => request(`/recognition/log${qs(params)}`),
  events:       (params = {})                  => request(`/recognition/events${qs(params)}`),
};

// ── Audit Logs ───────────────────────────────────────────────
export const AuditAPI = {
  list:   (params = {})  => request(`/audit-logs${qs(params)}`),
  exportUrl: ()          => `${API_BASE}/audit-logs/export`,
};

// ── Notifications ────────────────────────────────────────────
export const NotificationsAPI = {
  list: (params = {}) => request(`/notifications${qs(params)}`),
};

// ── Dashboard KPIs ───────────────────────────────────────────
export const DashboardAPI = {
  overview:       ()    => request(`/dashboard/overview`),
  kbAnalytics:    ()    => request(`/dashboard/kb-analytics`),
  recogAnalytics: ()    => request(`/dashboard/recognition-analytics`),
  monthlyTrend:   ()    => request(`/dashboard/monthly-trend`),
};

// ── Drafts (HR Coordinator workspace aggregator) ──────────────
export const DraftsAPI = {
  list: (submitter_id) => request(`/drafts${qs({ submitter_id })}`),
};

// ── Tasks (sticky note widget) ───────────────────────────────
export const TasksAPI = {
  list: async () => {
    const r = await request(`/tasks`);
    return (r.items || []).map(t => ({ id: t.id, txt: t.txt, done: !!t.done }));
  },
  create: async (txt) => {
    const t = await request(`/tasks`, { method: 'POST', body: { txt } });
    return { id: t.id, txt: t.txt, done: !!t.done };
  },
  toggle: async (id, done) => {
    const t = await request(`/tasks/${id}`, { method: 'PUT', body: { done } });
    return { id: t.id, txt: t.txt, done: !!t.done };
  },
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};

// helpers
function qs(params) {
  const filtered = Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '');
  if (filtered.length === 0) return '';
  return '?' + filtered.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}
