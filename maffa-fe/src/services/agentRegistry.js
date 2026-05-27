// services/agentRegistry.js
// Single source of truth for what Maffa can do on this dashboard.
// Each entry: { type, view?, target?, description, api?, fields? }
//
// type values:
//   'open_app'     — opens a desktop app/window (target = appId)
//   'toggle_panel' — opens/closes a UI panel or form
//   'set_state'    — local UI state mutation (no backend call)
//   'api_call'     — invokes a backend handler (api = "ApiObject.method")
//   'nav'          — switches the active sidebar view inside an app

export const AGENT_REGISTRY = {
  // ─── Dock (open desktop apps) ─────────────────────────────
  'BTN-DOCK-PORTAL':       { type: 'open_app', target: 'portal',    description: 'Open Employee Portal' },
  'BTN-DOCK-EVENTS':       { type: 'open_app', target: 'events',    description: 'Open HR Coordinator view' },
  'BTN-DOCK-OVERVIEW':     { type: 'open_app', target: 'overview',  description: 'Open HR Ops Dashboard' },
  'BTN-DOCK-AUDIT':        { type: 'open_app', target: 'audit-app', description: 'Open Compliance Reviewer view' },
  'BTN-DOCK-DASHBOARD':    { type: 'open_app', target: 'dashboard', description: 'Open Executive Dashboard' },
  'BTN-DOCK-MINIMIZE-ALL': { type: 'set_state', description: 'Minimize all open windows (show desktop)' },

  // ─── Left Strip (clock / calendar / notes) ────────────────
  'BTN-LEFTSTRIP-CLOCK':    { type: 'open_app', target: 'clockapp', description: 'Open Clock / Alarm / Timer app' },
  'BTN-LEFTSTRIP-CALENDAR': { type: 'open_app', target: 'calendar', description: 'Open Event Calendar' },
  'BTN-LEFTSTRIP-NEW-NOTE': { type: 'set_state', description: 'Create a new sticky note on the desktop' },

  // ─── Menu Bar ─────────────────────────────────────────────
  'BTN-MENUBAR-FILE':           { type: 'toggle_panel', description: 'Open the File menu' },
  'BTN-MENUBAR-VIEW':           { type: 'toggle_panel', description: 'Open the View menu' },
  'BTN-MENUBAR-WINDOW':         { type: 'toggle_panel', description: 'Open the Window menu' },
  'BTN-MENUBAR-EXPORT-AUDIT':   { type: 'set_state',    description: 'Trigger an audit-log export toast' },
  'BTN-MENUBAR-RESTORE-ALL':    { type: 'set_state',    description: 'Restore all minimized windows' },
  'BTN-MENUBAR-OPEN-PORTAL':    { type: 'open_app', target: 'portal',    description: 'Open Employee Portal from menu' },
  'BTN-MENUBAR-OPEN-EVENTS':    { type: 'open_app', target: 'events',    description: 'Open HR Coordinator view from menu' },
  'BTN-MENUBAR-OPEN-OVERVIEW':  { type: 'open_app', target: 'overview',  description: 'Open HR Ops Manager view from menu' },
  'BTN-MENUBAR-OPEN-AUDIT':     { type: 'open_app', target: 'audit-app', description: 'Open Compliance Reviewer view from menu' },
  'BTN-MENUBAR-CLOSE-ALL':      { type: 'set_state',    description: 'Close all open windows' },

  // ─── Audit Rail (right-edge live commentary) ──────────────
  'BTN-AUDIT-RAIL-TOGGLE':  { type: 'toggle_panel', description: 'Open/close the live audit rail panel' },
  'BTN-AUDIT-RAIL-EXPORT':  { type: 'api_call', api: 'AuditAPI.exportUrl', description: 'Export audit log as CSV (download)' },
  'BTN-AUDIT-RAIL-CLEAR':   { type: 'set_state', description: 'Clear visible audit rail entries' },
  'BTN-AUDIT-RAIL-REFRESH': { type: 'api_call', api: 'AuditAPI.list',      description: 'Refresh the audit rail' },
  'FIELD-AUDIT-FILTER':     { type: 'field', description: 'Filter text for the audit rail (client-side)' },

  // ─── Window chrome (per-app close/minimize + sidebar nav) ──
  // 'BTN-WINDOW-CLOSE-{appId}'  → close the named window
  // 'BTN-WINDOW-MIN-{appId}'    → minimize the named window
  // 'NAV-{APPID}-{VIEWID}'      → switch the active sidebar view inside an app

  // ─── Calendar app ─────────────────────────────────────────
  'BTN-CALENDAR-PREV':  { type: 'set_state', view: 'calendar', description: 'Show previous month' },
  'BTN-CALENDAR-TODAY': { type: 'set_state', view: 'calendar', description: 'Jump to current month' },
  'BTN-CALENDAR-NEXT':  { type: 'set_state', view: 'calendar', description: 'Show next month' },

  // ─── Clock app ────────────────────────────────────────────
  'BTN-CLOCK-TAB-clock':     { type: 'set_state', view: 'clockapp', description: 'Switch to Clock tab' },
  'BTN-CLOCK-TAB-world':     { type: 'set_state', view: 'clockapp', description: 'Switch to World Clock tab' },
  'BTN-CLOCK-TAB-alarm':     { type: 'set_state', view: 'clockapp', description: 'Switch to Alarm tab' },
  'BTN-CLOCK-TAB-timer':     { type: 'set_state', view: 'clockapp', description: 'Switch to Timer tab' },
  'FIELD-CLOCK-ALARM-TIME':  { type: 'field',     view: 'clockapp', description: 'New-alarm time (HH:MM)' },
  'BTN-CLOCK-ALARM-ADD':     { type: 'set_state', view: 'clockapp', description: 'Add a new alarm using FIELD-CLOCK-ALARM-TIME' },
  'FIELD-CLOCK-TIMER-MINUTES': { type: 'field',   view: 'clockapp', description: 'Timer countdown duration in minutes' },
  'BTN-CLOCK-TIMER-PLAY':    { type: 'set_state', view: 'clockapp', description: 'Start the countdown timer' },
  'BTN-CLOCK-TIMER-PAUSE':   { type: 'set_state', view: 'clockapp', description: 'Pause the countdown timer' },
  'BTN-CLOCK-TIMER-RESET':   { type: 'set_state', view: 'clockapp', description: 'Reset the countdown timer to 0' },
  // 'TOGGLE-CLOCK-ALARM-{alarm_id}'  → enable/disable a specific alarm
  // 'BTN-CLOCK-ALARM-DELETE-{alarm_id}' → delete a specific alarm

  // ─── Tasks Widget ─────────────────────────────────────────
  'BTN-TASK-ADD': { type: 'api_call', api: 'TasksAPI.create', description: 'Create a new task. Requires text input.' },
  // 'TOGGLE-TASK-{task_id}'   → mark a task done/undone
  // 'BTN-TASK-REMOVE-{task_id}' → delete a task

  // ─── Sticky Notes ─────────────────────────────────────────
  // 'BTN-NOTE-CLOSE-{id}'       → delete a sticky note
  // 'FIELD-NOTE-CONTENT-{id}'   → note body text

  // ─── Employee Portal — Home ───────────────────────────────
  'TOGGLE-PORTAL-NOTIFY-RECOGNITION': { type: 'api_call', view: 'portal', api: 'EmployeesAPI.setNotifyPrefs', description: 'Toggle birthdays & anniversaries notifications' },
  'TOGGLE-PORTAL-NOTIFY-EVENTS':      { type: 'api_call', view: 'portal', api: 'EmployeesAPI.setNotifyPrefs', description: 'Toggle engagement events notifications' },
  'TOGGLE-PORTAL-NOTIFY-SURVEYS':     { type: 'api_call', view: 'portal', api: 'EmployeesAPI.setNotifyPrefs', description: 'Toggle survey invitation notifications' },
  'BTN-RECOG-PREF-PUBLIC':            { type: 'api_call', view: 'portal', api: 'EmployeesAPI.setRecogPref',   description: 'Set recognition preference to public' },
  'BTN-RECOG-PREF-PRIVATE':           { type: 'api_call', view: 'portal', api: 'EmployeesAPI.setRecogPref',   description: 'Set recognition preference to private' },
  'BTN-RECOG-PREF-OFF':               { type: 'api_call', view: 'portal', api: 'EmployeesAPI.setRecogPref',   description: 'Disable recognition messages' },
  // 'BTN-REGISTER-{event_id}'   → EventsAPI.register(eventId, employeeId)
  // 'BTN-REGISTERED-{event_id}' → display-only, already-registered state

  // ─── Employee Portal — Knowledge Base ─────────────────────
  'FIELD-KB-QUERY': { type: 'field',    view: 'portalkb', description: 'KB search/question text' },
  'BTN-KB-SEND':    { type: 'api_call', view: 'portalkb', api: 'KBAPI.query', description: 'Submit the KB question. Reads FIELD-KB-QUERY.', fields: ['FIELD-KB-QUERY'] },

  // ─── Employee Portal — Survey Runner ──────────────────────
  'BTN-PREV':           { type: 'set_state', view: 'portalsurvey', description: 'Go to previous question' },
  'BTN-NEXT':           { type: 'set_state', view: 'portalsurvey', description: 'Go to next question' },
  'BTN-SUBMIT-SURVEY':  { type: 'api_call', view: 'portalsurvey', api: 'SurveysAPI.submit', description: 'Submit completed survey responses' },
  // 'BTN-SURVEY-RATING-{question_id}-{n}' → set a rating answer (1..5)
  // 'BTN-SURVEY-MCQ-{question_id}-{idx}'  → pick an MCQ option by index
  // 'FIELD-SURVEY-ANSWER-{question_id}'   → free-text answer

  // ─── HR Coordinator — Events ──────────────────────────────
  'BTN-NEW-EVENT':  { type: 'toggle_panel', view: 'events', description: 'Open the new event form' },
  'BTN-RUN-CYCLE':  { type: 'api_call',     view: 'events', api: 'RecognitionAPI.runCycle', description: 'Trigger recognition cycle' },
  'FIELD-EVENTS-NAME':        { type: 'field', view: 'events', description: 'Event name' },
  'FIELD-EVENTS-DESCRIPTION': { type: 'field', view: 'events', description: 'Event description' },
  'FIELD-EVENTS-TYPE':        { type: 'field', view: 'events', description: 'Event type (Team/Company/Other)' },
  'FIELD-EVENTS-AUDIENCE':    { type: 'field', view: 'events', description: 'Target audience' },
  'FIELD-EVENTS-REG-START':   { type: 'field', view: 'events', description: 'Registration start date (YYYY-MM-DD)' },
  'FIELD-EVENTS-REG-END':     { type: 'field', view: 'events', description: 'Registration end date (YYYY-MM-DD)' },
  'FIELD-EVENTS-DATE':        { type: 'field', view: 'events', description: 'Event date (YYYY-MM-DD)' },
  'FIELD-EVENTS-START-TIME':  { type: 'field', view: 'events', description: 'Event start datetime (ISO local)' },
  'FIELD-EVENTS-END-TIME':    { type: 'field', view: 'events', description: 'Event end datetime (ISO local)' },
  'BTN-SAVE-DRAFT': {
    type: 'api_call',
    view: 'events',
    description: 'Save current event as draft',
    api: 'EventsAPI.create',
    fields: [
      'FIELD-EVENTS-NAME', 'FIELD-EVENTS-DESCRIPTION', 'FIELD-EVENTS-TYPE',
      'FIELD-EVENTS-AUDIENCE', 'FIELD-EVENTS-REG-START', 'FIELD-EVENTS-REG-END',
      'FIELD-EVENTS-DATE', 'FIELD-EVENTS-START-TIME', 'FIELD-EVENTS-END-TIME',
    ],
  },
  'BTN-SUBMIT-EVENT': {
    type: 'api_call',
    view: 'events',
    description: 'Submit current event draft for HR Ops approval',
    api: 'EventsAPI.create',
    fields: [
      'FIELD-EVENTS-NAME', 'FIELD-EVENTS-DESCRIPTION', 'FIELD-EVENTS-TYPE',
      'FIELD-EVENTS-AUDIENCE', 'FIELD-EVENTS-REG-START', 'FIELD-EVENTS-REG-END',
      'FIELD-EVENTS-DATE', 'FIELD-EVENTS-START-TIME', 'FIELD-EVENTS-END-TIME',
    ],
  },
  'BTN-RUN-CYCLE-DASH': { type: 'api_call', view: 'recog', api: 'RecognitionAPI.runCycle', description: 'Run recognition cycle from the Recognition dashboard' },

  // ─── HR Coordinator — Surveys ─────────────────────────────
  'BTN-NEW-SURVEY':          { type: 'toggle_panel', view: 'surveys', description: 'Open the new survey form' },
  'BTN-ANON-ON':             { type: 'set_state',    view: 'surveys', description: 'Mark survey as anonymous' },
  'BTN-ANON-OFF':            { type: 'set_state',    view: 'surveys', description: 'Mark survey as non-anonymous' },
  'BTN-ADD-Q':               { type: 'set_state',    view: 'surveys', description: 'Add a new question to the survey draft' },
  'FIELD-SURVEY-TITLE':       { type: 'field', view: 'surveys', description: 'Survey title' },
  'FIELD-SURVEY-DESCRIPTION': { type: 'field', view: 'surveys', description: 'Survey description' },
  'FIELD-SURVEY-AUDIENCE':    { type: 'field', view: 'surveys', description: 'Survey target audience' },
  'FIELD-SURVEY-OPEN-DATE':   { type: 'field', view: 'surveys', description: 'Survey open date' },
  'FIELD-SURVEY-CLOSE-DATE':  { type: 'field', view: 'surveys', description: 'Survey close date' },
  'BTN-SAVE-SURVEY':          { type: 'api_call', view: 'surveys', api: 'SurveysAPI.create', description: 'Save survey as draft' },
  'BTN-SUBMIT-SURVEY-DRAFT':  { type: 'api_call', view: 'surveys', api: 'SurveysAPI.create', description: 'Submit survey for approval' },
  // 'FIELD-SURVEY-Q-TEXT-{i}'    → question i text
  // 'FIELD-SURVEY-Q-TYPE-{i}'    → question i type (rating|mcq|text)
  // 'FIELD-SURVEY-Q-OPTIONS-{i}' → MCQ options for question i (newline-separated)
  // 'BTN-SURVEY-Q-REMOVE-{i}'    → remove question i
  // 'BTN-SURVEY-EDIT-{survey_id}' → open existing survey for edit/view

  // ─── HR Coordinator — Drafts ──────────────────────────────
  // 'BTN-DRAFTS-RESUBMIT-{content_type}-{content_id}'
  //   → for content_type='template': RecognitionAPI.resubmit(content_id)
  //   → otherwise: opens the appropriate builder (toast)

  // ─── HR Coordinator — Recognition Templates ───────────────
  // 'BTN-RESUBMIT-{template_id}'      → RecognitionAPI.resubmit(template_id)
  // 'FIELD-TEMPLATES-PREF-{employee_id}' → EmployeesAPI.setRecogPref(employee_id, value)

  // ─── HR Ops Manager — Approvals ───────────────────────────
  'BTN-ESC-BREACHED': { type: 'api_call', view: 'approvals', api: 'ApprovalsAPI.escalateBreached', description: 'Escalate all SLA-breached approvals' },
  // 'FIELD-APPROVAL-COMMENTS-{approval_id}' → comments textarea
  // 'BTN-APPROVE-{approval_id}'             → ApprovalsAPI.decide(id, 'approved', comments)
  // 'BTN-REJECT-{approval_id}'              → ApprovalsAPI.decide(id, 'rejected', comments)

  // ─── HR Ops — Escalations ─────────────────────────────────
  // 'FIELD-ESCALATION-RESOLUTION-{escalation_id}'  → resolution text
  // 'BTN-SEND-{escalation_id}'                     → EscalationsAPI.resolve(id, 'send_response',     payload)
  // 'BTN-CREATE-KB-{escalation_id}'                → EscalationsAPI.resolve(id, 'create_kb_article', payload)
  // 'BTN-ESC-FURTHER-{escalation_id}'              → EscalationsAPI.resolve(id, 'escalate_further',  payload)

  // ─── Compliance — Audit Report ────────────────────────────
  'BTN-AUDIT-EXPORT': { type: 'api_call', view: 'audit', api: 'AuditAPI.exportUrl', description: 'Download Engagement Audit Report CSV' },
};

// Helper for Maffa's backend to look up handlers by exact ID, with templated fallback.
export function getRegistryEntry(id) {
  if (AGENT_REGISTRY[id]) return AGENT_REGISTRY[id];
  for (const key of Object.keys(AGENT_REGISTRY)) {
    if (key.includes('{')) {
      const pattern = '^' + key.replace(/\{[^}]+\}/g, '([^-]+)') + '$';
      if (new RegExp(pattern).test(id)) return AGENT_REGISTRY[key];
    }
  }
  for (const key of Object.keys(TEMPLATED_HANDLERS)) {
    const pattern = '^' + key.replace(/\{[^}]+\}/g, '([^-]+)') + '$';
    if (new RegExp(pattern).test(id)) return TEMPLATED_HANDLERS[key];
  }
  return null;
}

// Templated handlers — Maffa substitutes the value at runtime.
// These are documented here (not in AGENT_REGISTRY) so the registry stays a flat lookup.
export const TEMPLATED_HANDLERS = {
  'BTN-WINDOW-CLOSE-{appId}':       { type: 'set_state', description: 'Close the named window' },
  'BTN-WINDOW-MIN-{appId}':         { type: 'set_state', description: 'Minimize the named window' },
  'NAV-{APPID}-{VIEWID}':           { type: 'nav',       description: 'Switch the sidebar nav inside an app' },
  'BTN-MENUBAR-FOCUS-{appId}':      { type: 'set_state', description: 'Focus an open window from the Window menu' },

  'TOGGLE-CLOCK-ALARM-{alarm_id}':       { type: 'set_state', description: 'Enable/disable an alarm' },
  'BTN-CLOCK-ALARM-DELETE-{alarm_id}':   { type: 'set_state', description: 'Delete an alarm' },

  'TOGGLE-TASK-{task_id}':    { type: 'api_call', api: 'TasksAPI.toggle', description: 'Toggle a task done/undone' },
  'BTN-TASK-REMOVE-{task_id}': { type: 'api_call', api: 'TasksAPI.remove', description: 'Delete a task' },

  'BTN-NOTE-CLOSE-{id}':      { type: 'set_state', description: 'Close (delete) a sticky note' },
  'FIELD-NOTE-CONTENT-{id}':  { type: 'field',     description: 'Sticky note body text' },

  'BTN-REGISTER-{event_id}':    { type: 'api_call', api: 'EventsAPI.register',   description: 'Register the current employee for an event' },
  'BTN-REGISTERED-{event_id}':  { type: 'display',  description: 'Already-registered display state (non-clickable)' },

  'BTN-SURVEY-RATING-{question_id}-{n}':  { type: 'set_state', description: 'Choose a rating value for a question' },
  'BTN-SURVEY-MCQ-{question_id}-{idx}':   { type: 'set_state', description: 'Choose an MCQ option for a question' },
  'FIELD-SURVEY-ANSWER-{question_id}':    { type: 'field',     description: 'Free-text answer for a question' },
  'FIELD-SURVEY-Q-TEXT-{i}':              { type: 'field',     description: 'Question i text in survey draft' },
  'FIELD-SURVEY-Q-TYPE-{i}':              { type: 'field',     description: 'Question i type in survey draft' },
  'FIELD-SURVEY-Q-OPTIONS-{i}':           { type: 'field',     description: 'Question i MCQ options in survey draft' },
  'BTN-SURVEY-Q-REMOVE-{i}':              { type: 'set_state', description: 'Remove question i from survey draft' },
  'BTN-SURVEY-EDIT-{survey_id}':          { type: 'set_state', description: 'Open existing survey for edit/view' },

  'BTN-DRAFTS-RESUBMIT-{content_type}-{content_id}': {
    type: 'api_call',
    api: 'RecognitionAPI.resubmit',
    description: 'Resubmit a draft (templates call API; surveys/events open builder)',
  },
  'BTN-RESUBMIT-{template_id}':     { type: 'api_call', api: 'RecognitionAPI.resubmit',  description: 'Resubmit a recognition template for approval' },
  'FIELD-TEMPLATES-PREF-{employee_id}': { type: 'api_call', api: 'EmployeesAPI.setRecogPref', description: 'Update an employee recognition preference' },

  'FIELD-APPROVAL-COMMENTS-{approval_id}': { type: 'field', description: 'Comments textarea for an approval row' },
  'BTN-APPROVE-{approval_id}':             { type: 'api_call', api: 'ApprovalsAPI.decide', description: 'Approve an item (decision="approved")' },
  'BTN-REJECT-{approval_id}':              { type: 'api_call', api: 'ApprovalsAPI.decide', description: 'Return/reject an item (decision="rejected")' },

  'FIELD-ESCALATION-RESOLUTION-{escalation_id}': { type: 'field', description: 'Resolution / response text for an escalation' },
  'BTN-SEND-{escalation_id}':         { type: 'api_call', api: 'EscalationsAPI.resolve', description: "Send a response (action='send_response')" },
  'BTN-CREATE-KB-{escalation_id}':    { type: 'api_call', api: 'EscalationsAPI.resolve', description: "Promote response to KB article (action='create_kb_article')" },
  'BTN-ESC-FURTHER-{escalation_id}':  { type: 'api_call', api: 'EscalationsAPI.resolve', description: "Escalate further (action='escalate_further')" },
};
