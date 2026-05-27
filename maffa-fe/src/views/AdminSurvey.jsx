// views/AdminSurvey.jsx — HR Coordinator: Survey Creation & Management
import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Badge, SDot } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { SurveysAPI } from '../services/api.js';

const CURRENT_USER_ID = 2;

const todayStr = () => new Date().toISOString().slice(0, 10);
const plusDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function AdminSurvey() {
  const { toast } = useDesktop();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({
    title: '', description: '', target_audience: 'All Employees',
    open_date: todayStr(),
    close_date: plusDays(14),
    is_anonymous: true,
    questions: [
      { question_text: 'How would you rate your overall work-life balance this quarter?', question_type: 'rating', options: { min: 1, max: 5, min_label: 'Poor', max_label: 'Excellent' } },
    ],
  });

  const reload = () => {
    setLoading(true);
    SurveysAPI.list({ limit: 50 })
      .then(d => setSurveys(d.items || []))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const editDraft = (s) => {
    SurveysAPI.get(s.survey_id).then(full => {
      setDraft({
        title: full.title || '',
        description: full.description || '',
        target_audience: full.audience || full.target_audience || 'All Employees',
        open_date: full.open_date || todayStr(),
        close_date: full.close_date || plusDays(14),
        is_anonymous: !!full.is_anonymous,
        questions: (full.questions || []).map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
        })),
        _editing_id: full.survey_id,
      });
      setShowCreate(true);
    }).catch(e => toast('Error', e.message));
  };

  const submit = async (forApproval) => {
    try {
      if (draft._editing_id) {
        toast('Editing draft', 'Saved as new revision (versioning is single-revision in MVP).');
      }
      const { _editing_id, ...payload } = draft;
      await SurveysAPI.create({
        ...payload, created_by: CURRENT_USER_ID,
        submit_for_approval: forApproval,
      });
      toast(forApproval ? 'Submitted' : 'Saved', forApproval ? 'Sent to HR Ops Manager' : 'Saved as draft');
      setShowCreate(false);
      setDraft({
        title: '', description: '', target_audience: 'All Employees',
        open_date: todayStr(),
        close_date: plusDays(14),
        is_anonymous: true,
        questions: [{ question_text: '', question_type: 'rating', options: { min: 1, max: 5, min_label: 'Poor', max_label: 'Excellent' } }],
      });
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  const addQ = () => setDraft(d => ({ ...d, questions: [...d.questions, { question_text: '', question_type: 'rating', options: { min: 1, max: 5, min_label: 'Poor', max_label: 'Excellent' } }] }));
  const removeQ = (i) => setDraft(d => ({ ...d, questions: d.questions.filter((_, idx) => idx !== i) }));
  const updateQ = (i, patch) => setDraft(d => ({ ...d, questions: d.questions.map((q, idx) => idx === i ? { ...q, ...patch } : q) }));

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR COORDINATOR</div>
        <div className="ban-title">Survey Creation &amp; Management</div>
        <div className="ban-desc">Design surveys, configure anonymity, submit for approval.</div>
        <div className="ban-chips">
          <span className="ban-chip">{surveys.length} Surveys</span>
          <span className="ban-chip">{surveys.filter(s => s.is_anonymous).length} Anonymous</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-p btn-sm" onClick={() => setShowCreate(s => !s)} data-btn-id="BTN-NEW-SURVEY">
          {showCreate ? 'Close' : '+ New Survey'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb12">
          <div className="card-hd"><div className="card-title">New Survey</div><Badge cls="bp">Draft</Badge></div>
          <div className="card-bd">
            <Field label="Title"><input type="text" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} style={inputStyle} data-field-id="FIELD-SURVEY-TITLE" /></Field>
            <Field label="Description"><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} style={{ ...inputStyle, minHeight: 50 }} data-field-id="FIELD-SURVEY-DESCRIPTION" /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="Audience"><input type="text" value={draft.target_audience} onChange={e => setDraft({ ...draft, target_audience: e.target.value })} style={inputStyle} data-field-id="FIELD-SURVEY-AUDIENCE" /></Field>
              <Field label="Anonymity">
                <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                  <button className={`btn btn-sm ${draft.is_anonymous ? 'btn-p' : 'btn-o'}`} onClick={() => setDraft({ ...draft, is_anonymous: true })} data-btn-id="BTN-ANON-ON">🔒 Anonymous</button>
                  <button className={`btn btn-sm ${!draft.is_anonymous ? 'btn-p' : 'btn-o'}`} onClick={() => setDraft({ ...draft, is_anonymous: false })} data-btn-id="BTN-ANON-OFF">👤 Non-Anon</button>
                </div>
              </Field>
              <Field label="Open Date"><input type="date" value={draft.open_date} onChange={e => setDraft({ ...draft, open_date: e.target.value })} style={inputStyle} data-field-id="FIELD-SURVEY-OPEN-DATE" /></Field>
              <Field label="Close Date"><input type="date" value={draft.close_date} onChange={e => setDraft({ ...draft, close_date: e.target.value })} style={inputStyle} data-field-id="FIELD-SURVEY-CLOSE-DATE" /></Field>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--n3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Questions ({draft.questions.length})</div>
                <button className="btn btn-o btn-sm" onClick={addQ} data-btn-id="BTN-ADD-Q">+ Add Question</button>
              </div>
              {draft.questions.map((q, i) => (
                <div key={i} style={{ border: '1px solid var(--n7)', borderRadius: 6, padding: 8, marginBottom: 6, background: 'var(--n8)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600 }}>Q{i + 1}</span>
                    {draft.questions.length > 1 && (
                      <button className="btn btn-o btn-sm" onClick={() => removeQ(i)} style={{ padding: '2px 6px' }} data-btn-id={`BTN-SURVEY-Q-REMOVE-${i}`}>×</button>
                    )}
                  </div>
                  <input type="text" value={q.question_text} onChange={e => updateQ(i, { question_text: e.target.value })} placeholder="Question text…" style={inputStyle} data-field-id={`FIELD-SURVEY-Q-TEXT-${i}`} />
                  <select value={q.question_type} onChange={e => updateQ(i, { question_type: e.target.value })} style={{ ...inputStyle, marginTop: 4 }} data-field-id={`FIELD-SURVEY-Q-TYPE-${i}`}>
                    <option value="rating">Rating Scale</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="text">Open Text</option>
                  </select>
                  {q.question_type === 'mcq' && (
                    <textarea
                      placeholder="One option per line"
                      value={(q.options || []).join('\n')}
                      onChange={e => updateQ(i, { options: e.target.value.split('\n').filter(Boolean) })}
                      style={{ ...inputStyle, marginTop: 4, minHeight: 50 }}
                      data-field-id={`FIELD-SURVEY-Q-OPTIONS-${i}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="card-bd" style={{ borderTop: '1px solid var(--n7)', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-o btn-sm agent-only" onClick={() => submit(false)} data-btn-id="BTN-SAVE-SURVEY">Save Draft</button>
            <button className="btn btn-p btn-sm agent-only" onClick={() => submit(true)} data-btn-id="BTN-SUBMIT-SURVEY-DRAFT">Submit for Approval</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-hd"><div className="card-title">All Surveys</div></div>
        <table className="tbl">
          <thead><tr><th>Survey</th><th>Audience</th><th>Anonymity</th><th>Opens</th><th>Closes</th><th>Status</th><th>Response %</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 16 }}>Loading…</td></tr>}
            {!loading && surveys.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 16, color: 'var(--n4)' }}>No surveys</td></tr>}
            {surveys.map(s => (
              <tr key={s.survey_id}>
                <td><strong>{s.title}</strong></td>
                <td>{s.audience || s.target_audience || '–'}</td>
                <td>
                  <Badge cls={s.is_anonymous ? 'bgr' : 'bcy'}>
                    {s.is_anonymous ? '🔒 Anonymous' : '👤 Non-Anon'}
                  </Badge>
                </td>
                <td>{s.open_date || '–'}</td>
                <td>{s.close_date || '–'}</td>
                <td><SDot cls={s.status === 'active' ? 'dg' : 'dy'}>{s.status || 'draft'}</SDot></td>
                <td>{s.response_pct ?? 0}%</td>
                <td style={{ textAlign: 'right' }}>
                  {s.status === 'draft' && (
                    <button className="btn btn-o btn-sm" onClick={() => editDraft(s)} data-btn-id={`BTN-SURVEY-EDIT-${s.survey_id}`}>
                      <Pencil size={11} style={{ marginRight: 4 }} />Edit
                    </button>
                  )}
                  {s.status === 'pending_approval' && <Badge cls="bcy">Awaiting</Badge>}
                  {s.status === 'active' && (
                    <button className="btn btn-o btn-sm" onClick={() => editDraft(s)} data-btn-id={`BTN-SURVEY-EDIT-${s.survey_id}`}>View</button>
                  )}
                </td>
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
