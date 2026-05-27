// views/Audit.jsx — Compliance: Engagement Audit Report
import { useEffect, useState } from 'react';
import { Badge } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { AuditAPI } from '../services/api.js';

export default function Audit() {
  const { toast } = useDesktop();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuditAPI.list({ limit: 100 })
      .then(d => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = () => {
    window.location.href = AuditAPI.exportUrl();
    toast('Export Started', 'CSV download started — Engagement Audit Report');
  };

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">COMPLIANCE REVIEWER</div>
        <div className="ban-title">Engagement Audit Report</div>
        <div className="ban-desc">Append-only audit log — every decision, delivery, query and response.</div>
        <div className="ban-chips">
          <span className="ban-chip">{items.length} Entries</span>
          <span className="ban-chip">Append-Only</span>
          <span className="ban-chip">7yr Retention</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-p btn-sm agent-only" onClick={exportCsv} data-btn-id="BTN-AUDIT-EXPORT">
          ⬇ Export CSV
        </button>
      </div>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>Event</th><th>Actor</th><th>Content</th><th>Outcome</th><th>Timestamp</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 16 }}>Loading…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: 16, color: 'var(--n4)' }}>No audit entries</td></tr>}
            {items.map(l => (
              <tr key={l.log_id}>
                <td>
                  <strong>{l.event_type}</strong>
                  {l.is_anonymous && <Badge cls="bgr" style={{ marginLeft: 4 }}>🔒 Anon</Badge>}
                </td>
                <td>{l.is_anonymous ? '(anonymous)' : (l.employee_id ? `Emp #${l.employee_id}` : '–')}</td>
                <td>{l.content_id ? `#${l.content_id}` : '–'}{l.detail && <div style={{ fontSize: 9, color: 'var(--n4)' }}>{l.detail}</div>}</td>
                <td>
                  <Badge cls={l.outcome === 'success' ? 'bok' : l.outcome === 'failed' ? 'ber' : l.outcome === 'sla_breached' ? 'bcy' : 'bgr'}>
                    {l.outcome}
                  </Badge>
                </td>
                <td style={{ fontSize: 10, color: 'var(--n4)' }}>{(l.created_at || '').slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
