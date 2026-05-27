// ─────────────────────────────────────────────────────────────
// data/index.js — All static mock data for Wolf Pack Agent Desktop
//
// DEVELOPER NOTE (FastAPI + PostgreSQL):
//   Replace these arrays/objects with API calls from services/api.js
//   Each dataset has a corresponding endpoint suggestion.
// ─────────────────────────────────────────────────────────────

// GET /api/tasks
export const INITIAL_TASKS = [
  { id: 1, txt: 'Approve Visa & Work Permit Guide',     done: true  },
  { id: 2, txt: 'Respond to QR-2816 (SLA breach)',      done: true  },
  { id: 3, txt: 'Review Anniversary Template v4',       done: false },
  { id: 4, txt: 'Export Q2 audit summary',              done: false },
  { id: 5, txt: 'KB gap analysis — Travel Insurance',   done: false },
];

// NOTE_COLORS[i] pairs: [background, barColor]
export const NOTE_COLORS = [
  ['#fffbe6','#ffd700'],
  ['#e8f4ff','#60a5fa'],
  ['#f0fdf4','#86efac'],
  ['#fef3c7','#fcd34d'],
  ['#fee2e2','#f87171'],
  ['#f5f3ff','#d8b4fe'],
];

// (AUDIT_DATA removed - now fully live via AuditAPI)
// App registry — GET /api/apps or keep as config
export const APPS = {
  portal: {
    title: 'Employee Portal', w: 840, h: 600,
    nav: [
      { s: 'MY WORKSPACE' },
      { id: 'portal-home',   ico: 'home', lbl: 'My Portal'         },
      { id: 'portal-survey', ico: 'surv', lbl: 'Active Survey'     },
      { s: 'HR HELP' },
      { id: 'portal-kb',     ico: 'kb',   lbl: 'HR Knowledge Base' },
    ],
    def: 'portal-home', av: 'AM', name: 'Aisha Mehta',   role: 'Employee',
  },
  events: {
    title: 'HR Coordinator', w: 860, h: 600,
    nav: [
      { s: 'MANAGE' },
      { id: 'admin-events',     ico: 'cal',   lbl: 'Events'                 },
      { id: 'admin-survey',     ico: 'surv',  lbl: 'Surveys'                },
      { id: 'admin-templates',  ico: 'bell',  lbl: 'Recognition Templates'  },
      { s: 'QUEUE' },
      { id: 'admin-drafts',     ico: 'draft', lbl: 'Draft Items'            },
    ],
    def: 'admin-events', av: 'YY', name: 'Yogesh Y',      role: 'HR Coordinator',
  },
  overview: {
    title: 'HR Ops Manager', w: 900, h: 600,
    nav: [
      { s: 'OVERVIEW' },
      { id: 'dash-overview', ico: 'grid',  lbl: 'Engagement Overview'    },
      { s: 'ANALYTICS' },
      { id: 'dash-recog',    ico: 'bell',  lbl: 'Recognition & Events'   },
      { id: 'dash-kb',       ico: 'kb',    lbl: 'KB & Queries'           },
      { s: 'APPROVALS' },
      { id: 'approval',      ico: 'check', lbl: 'Content Approval Queue' },
      { id: 'escalation',    ico: 'esc',   lbl: 'Query Escalation Queue' },
    ],
    def: 'dash-overview', av: 'RK', name: 'Rajesh Kumar', role: 'HR Ops Manager',
  },
  'audit-app': {
    title: 'Compliance Reviewer', w: 860, h: 600,
    nav: [
      { s: 'AUDIT' },
      { id: 'audit', ico: 'lock', lbl: 'Audit Log Viewer' },
    ],
    def: 'audit', av: 'RB', name: 'Rajib Basu', role: 'Compliance Reviewer',
  },
  dashboard: { title: 'Dashboard',               w: 900, h: 600 },
  calendar:  { title: 'Calendar',                w: 720, h: 640, defaultFullscreen: false },
  clockapp:  { title: 'Clock — Alarm & Timer',   w: 360, h: 480, defaultFullscreen: false },
  approval: {
    title: 'HR Ops Manager', w: 900, h: 600,
    nav: [
      { s: 'OVERVIEW' },
      { id: 'dash-overview', ico: 'grid',  lbl: 'Engagement Overview'    },
      { s: 'ANALYTICS' },
      { id: 'dash-recog',    ico: 'bell',  lbl: 'Recognition & Events'   },
      { id: 'dash-kb',       ico: 'kb',    lbl: 'KB & Queries'           },
      { s: 'APPROVALS' },
      { id: 'approval',      ico: 'check', lbl: 'Content Approval Queue' },
      { id: 'escalation',    ico: 'esc',   lbl: 'Query Escalation Queue' },
    ],
    def: 'approval', av: 'RK', name: 'Rajesh Kumar', role: 'HR Ops Manager',
  },
  escalation: {
    title: 'HR Ops Manager', w: 900, h: 600,
    nav: [
      { s: 'OVERVIEW' },
      { id: 'dash-overview', ico: 'grid',  lbl: 'Engagement Overview'    },
      { s: 'ANALYTICS' },
      { id: 'dash-recog',    ico: 'bell',  lbl: 'Recognition & Events'   },
      { id: 'dash-kb',       ico: 'kb',    lbl: 'KB & Queries'           },
      { s: 'APPROVALS' },
      { id: 'approval',      ico: 'check', lbl: 'Content Approval Queue' },
      { id: 'escalation',    ico: 'esc',   lbl: 'Query Escalation Queue' },
    ],
    def: 'escalation', av: 'RK', name: 'Rajesh Kumar', role: 'HR Ops Manager',
  },
};

// Gradient & icon maps for recent apps (dock popup)
export const APP_GRADS = {
  portal:     'linear-gradient(135deg,#CF008B,#A855F7)',
  events:     'linear-gradient(135deg,#5929d0,#6B8EF0)',
  overview:   'linear-gradient(135deg,#0E2E89,#22D3EE)',
  dashboard:  'linear-gradient(135deg,#0E2E89,#38bdf8)',
  'audit-app':'linear-gradient(135deg,#0E2E89,#5929d0)',
  approval:   'linear-gradient(135deg,#16A34A,#22D3EE)',
  escalation: 'linear-gradient(135deg,#DC2626,#E4902E)',
  calendar:   'linear-gradient(135deg,#0E2E89,#38bdf8)',
  clockapp:   'linear-gradient(135deg,#5929d0,#22D3EE)',
};
