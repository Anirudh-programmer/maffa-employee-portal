// views/AdminTemplates.jsx — HR Coordinator: Recognition Templates + Employee Preferences
import { useEffect, useState } from 'react';
import { Badge } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { RecognitionAPI, EmployeesAPI } from '../services/api.js';

export default function AdminTemplates() {
  const { toast } = useDesktop();
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    Promise.all([
      RecognitionAPI.templates({ limit: 50 }),
      EmployeesAPI.list({ limit: 50 }),
    ]).then(([t, e]) => {
      setTemplates(t.items || []);
      setEmployees(e.items || []);
    }).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const resubmit = async (id) => {
    try {
      await RecognitionAPI.resubmit(id);
      toast('Resubmitted', 'Sent for approval');
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  const setPref = async (id, pref) => {
    try {
      await EmployeesAPI.setRecogPref(id, pref);
      toast('Preference Updated', `Set to ${pref}`);
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR COORDINATOR</div>
        <div className="ban-title">Recognition Templates</div>
        <div className="ban-desc">Manage birthday/anniversary templates and employee recognition preferences.</div>
        <div className="ban-chips">
          <span className="ban-chip">{templates.length} Templates</span>
          <span className="ban-chip">{templates.filter(t => t.approved_status === 'approved').length} Approved</span>
        </div>
      </div>

      <div className="card mb12">
        <div className="card-hd"><div className="card-title">Templates</div></div>
        <table className="tbl">
          <thead><tr><th>Template</th><th>Type</th><th>Version</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 16 }}>Loading…</td></tr>}
            {templates.map(t => (
              <tr key={t.template_id}>
                <td><strong>{t.template_name}</strong></td>
                <td><Badge cls="bp">{t.event_type}</Badge></td>
                <td>v{t.version}</td>
                <td>
                  <Badge cls={t.approved_status === 'approved' ? 'bok' : t.approved_status === 'rejected' ? 'ber' : 'bgr'}>
                    {t.approved_status}
                  </Badge>
                </td>
                <td>
                  {t.approved_status !== 'approved' && (
                    <button className="btn btn-o btn-sm agent-only" onClick={() => resubmit(t.template_id)} data-btn-id={`BTN-RESUBMIT-${t.template_id}`}>
                      Resubmit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-hd">
          <div className="card-title">Employee Recognition Preferences</div>
        </div>
        <table className="tbl">
          <thead><tr><th>Employee</th><th>Department</th><th>Status</th><th>Preference</th></tr></thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.employee_id}>
                <td><strong>{e.name}</strong><div style={{ fontSize: 9, color: 'var(--n4)' }}>{e.role}</div></td>
                <td>{e.department}</td>
                <td>
                  <Badge cls={e.employment_status === 'active' ? 'bok' : e.employment_status === 'on_leave' ? 'bcy' : e.employment_status === 'terminated' ? 'ber' : 'bp'}>
                    {e.employment_status || 'active'}
                  </Badge>
                </td>
                <td>
                  <select
                    value={e.recognition_preference || 'public'}
                    onChange={ev => setPref(e.employee_id, ev.target.value)}
                    style={{
                      padding: '4px 6px', fontSize: 10,
                      border: '1px solid var(--n7)', borderRadius: 4,
                      background: 'var(--n8)', color: 'var(--n1)',
                    }}
                    data-field-id={`FIELD-TEMPLATES-PREF-${e.employee_id}`}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="off">Off</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
