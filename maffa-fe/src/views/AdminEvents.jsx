// views/AdminEvents.jsx — HR Coordinator: Engagement Events
import { useEffect, useState } from 'react';
import { Badge, SDot } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { EventsAPI, RecognitionAPI } from '../services/api.js';

const CURRENT_USER_ID = 2;  // Yogesh (HR Coordinator)

const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function AdminEvents() {
  const { toast } = useDesktop();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    event_name: '', event_type: 'Team', description: '',
    target_audience: 'All Employees',
    registration_start: todayStr(),
    registration_end: plusDays(7),
    event_date: plusDays(14),
    event_start_time: '', event_end_time: '',
  });

  const reload = () => {
    setLoading(true);
    EventsAPI.list({ limit: 50 })
      .then(d => setEvents(d.items || []))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const submit = async (forApproval) => {
    try {
      const payload = { ...draft, created_by: CURRENT_USER_ID, submit_for_approval: forApproval };
      await EventsAPI.create(payload);
      toast(forApproval ? 'Submitted' : 'Saved', forApproval ? 'Sent for HR Ops approval' : 'Saved as draft');
      setShowCreate(false);
      setDraft({ event_name: '', event_type: 'Team', description: '', target_audience: 'All Employees', registration_start: todayStr(), registration_end: plusDays(7), event_date: plusDays(14), event_start_time: '', event_end_time: '' });
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  const runCycle = async () => {
    try {
      const r = await RecognitionAPI.runCycle();
      toast('Recognition Cycle', `${r.triggered_count} triggered · ${r.skipped_count} skipped · ${r.flagged_count} flagged`);
    } catch (e) {
      toast('Error', e.message);
    }
  };

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR COORDINATOR</div>
        <div className="ban-title">Engagement Events</div>
        <div className="ban-desc">Create and manage events; submit for HR Ops approval.</div>
        <div className="ban-chips">
          <span className="ban-chip">{events.length} Events</span>
          <span className="ban-chip">{events.filter(e => e.status === 'published').length} Published</span>
          <span className="ban-chip">{events.filter(e => e.status === 'draft').length} Drafts</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-o btn-sm agent-only" onClick={runCycle} data-btn-id="BTN-RUN-CYCLE">
          ⟳ Trigger Recognition Cycle
        </button>
        <button className="btn btn-p btn-sm" onClick={() => setShowCreate(s => !s)} data-btn-id="BTN-NEW-EVENT">
          {showCreate ? 'Close' : '+ New Event'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb12">
          <div className="card-hd">
            <div className="card-title">New Event</div>
            <Badge cls="bp">Draft</Badge>
          </div>
          <div className="card-bd">
            <Field label="Event Name">
              <input type="text" value={draft.event_name} onChange={e => setDraft({ ...draft, event_name: e.target.value })} className="fin" style={inputStyle} data-field-id="FIELD-EVENTS-NAME" />
            </Field>
            <Field label="Description">
              <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} data-field-id="FIELD-EVENTS-DESCRIPTION" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Type">
                <select value={draft.event_type} onChange={e => setDraft({ ...draft, event_type: e.target.value })} style={inputStyle} data-field-id="FIELD-EVENTS-TYPE">
                  <option>Team</option><option>Company</option><option>Other</option>
                </select>
              </Field>
              <Field label="Target Audience">
                <input type="text" value={draft.target_audience} onChange={e => setDraft({ ...draft, target_audience: e.target.value })} style={inputStyle} data-field-id="FIELD-EVENTS-AUDIENCE" />
              </Field>
              <Field label="Registration Start">
                <input type="date" value={draft.registration_start} onChange={e => setDraft({ ...draft, registration_start: e.target.value })} style={inputStyle} data-field-id="FIELD-EVENTS-REG-START" />
              </Field>
              <Field label="Registration End">
                <input type="date" value={draft.registration_end} onChange={e => setDraft({ ...draft, registration_end: e.target.value })} style={inputStyle} data-field-id="FIELD-EVENTS-REG-END" />
              </Field>
              <Field label="Event Date">
                <input type="date" value={draft.event_date} onChange={e => setDraft({ ...draft, event_date: e.target.value })} style={inputStyle} data-field-id="FIELD-EVENTS-DATE" />
              </Field>
              <Field label="Start Time">
                <input type="datetime-local" value={draft.event_start_time} onChange={e => setDraft({ ...draft, event_start_time: e.target.value })} style={inputStyle} data-field-id="FIELD-EVENTS-START-TIME" />
              </Field>
              <Field label="End Time">
                <input type="datetime-local" value={draft.event_end_time} onChange={e => setDraft({ ...draft, event_end_time: e.target.value })} style={inputStyle} data-field-id="FIELD-EVENTS-END-TIME" />
              </Field>
            </div>
          </div>
          <div className="card-bd" style={{ borderTop: '1px solid var(--n7)', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-o btn-sm agent-only" onClick={() => submit(false)} data-btn-id="BTN-SAVE-DRAFT">Save Draft</button>
            <button className="btn btn-p btn-sm agent-only" onClick={() => submit(true)} data-btn-id="BTN-SUBMIT-EVENT">Submit for Approval</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-hd"><div className="card-title">All Events</div></div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Event</th><th>Audience</th><th>Date</th><th>Status</th><th>Approval</th><th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 16 }}>Loading…</td></tr>}
            {!loading && events.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 16, color: 'var(--n4)' }}>No events</td></tr>}
            {events.map(e => (
              <tr key={e.event_id}>
                <td><strong>{e.event_name}</strong><div style={{ fontSize: 9, color: 'var(--n4)' }}>{e.event_type}</div></td>
                <td>{e.target_audience}</td>
                <td>{e.event_date || '–'}</td>
                <td><SDot cls={e.status === 'published' ? 'dg' : 'dy'}>{e.status}</SDot></td>
                <td><Badge cls={e.approved_status === 'approved' ? 'bok' : e.approved_status === 'rejected' ? 'ber' : 'bgr'}>{e.approved_status}</Badge></td>
                <td>{e.participant_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const inputStyle = {
  width: '100%', padding: '6px 8px', fontSize: 11,
  border: '1px solid var(--n7)', borderRadius: 4,
  background: 'var(--n8)', color: 'var(--n1)', marginTop: 2,
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, color: 'var(--n4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      {children}
    </div>
  );
}
