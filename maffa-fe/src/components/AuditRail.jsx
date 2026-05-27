// components/AuditRail.jsx — live audit stream
import { useState, useEffect, useCallback } from 'react';
import { useDesktop } from '../context/DesktopContext.jsx';
import { AuditAPI } from '../services/api.js';
import { Info, Check, Bell, AlertTriangle, ArrowRight, Eye } from 'lucide-react';

const POLL_MS = 3000;

const IC_AUDIT = {
  in: <Info size={12} color="var(--p)" strokeWidth={1.8} />,
  ok: <Check size={12} color="var(--ok)" strokeWidth={1.8} />,
  pk: <Bell size={12} color="var(--pink)" strokeWidth={1.8} />,
  wn: <AlertTriangle size={12} color="var(--wn)" strokeWidth={1.8} />,
  er: <ArrowRight size={12} color="var(--er)" strokeWidth={1.8} />,
  mu: <Eye size={12} color="var(--n5)" strokeWidth={1.8} />,
};

function formatLogs(items) {
  return (items || []).map(log => {
    let bg = '#E8E5FF', ic = 'in', bc = 'ab-in', bt = 'Event';
    const type = (log.event_type || '').toLowerCase();
    const out = (log.outcome || '').toLowerCase();
    if (out.includes('fail') || out.includes('reject') || type.includes('reject')) {
      bg = '#FEE2E2'; ic = 'er'; bc = 'ab-er'; bt = 'Failed/Rejected';
    } else if (out.includes('breach')) {
      bg = '#FEF3C7'; ic = 'wn'; bc = 'ab-wn'; bt = 'SLA Breached';
    } else if (out.includes('success') || type.includes('approv')) {
      bg = '#DCFCE7'; ic = 'ok'; bc = 'ab-ok'; bt = 'Success';
    } else if (type.includes('escalat')) {
      bg = '#FEF3C7'; ic = 'wn'; bc = 'ab-wn'; bt = 'Escalated';
    } else if (type.includes('recogn')) {
      bg = '#FFD6F4'; ic = 'pk'; bc = 'ab-ok'; bt = 'Recognition';
    }
    const empPart = log.is_anonymous ? '🔒 Anon' : (log.employee_id ? `EMP-${log.employee_id}` : 'System');
    let dateStr = log.created_at;
    if (dateStr && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr = dateStr + 'Z';
    }
    const createdAt = dateStr ? new Date(dateStr) : null;
    return {
      bg, ic, bc, bt,
      ttl: log.event_type || 'System Event',
      met: `${empPart} · ${(log.channel || 'system').toUpperCase()}`,
      ts: createdAt ? createdAt.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
      createdAt,
    };
  });
}

export default function AuditRail() {
  const { auditOpen, setAuditOpen, toast } = useDesktop();
  const [auditLogs, setAuditLogs] = useState([]);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [clearedAt, setClearedAt] = useState(null);

  const fetchLogs = useCallback(() => {
    AuditAPI.list({ limit: 50 }).then(d => {
      setAuditLogs(formatLogs(d.items || []));
      setLastSyncAt(new Date());
    }).catch(err => console.error('Audit fetch failed', err));
  }, []);

  useEffect(() => {
    if (!auditOpen) return;
    let mounted = true;
    const tick = () => {
      AuditAPI.list({ limit: 50 }).then(d => {
        if (!mounted) return;
        setAuditLogs(formatLogs(d.items || []));
        setLastSyncAt(new Date());
      }).catch(err => console.error('Audit fetch failed', err));
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { mounted = false; clearInterval(id); };
  }, [auditOpen]);

  const toggle = () => setAuditOpen(o => !o);
  const exportCsv = () => {
    window.location.href = AuditAPI.exportUrl();
    toast('Export Started', 'Audit log CSV download started');
  };

  const visibleLogs = clearedAt
    ? auditLogs.filter(r => r.createdAt && r.createdAt > clearedAt)
    : auditLogs;

  const lastSyncTxt = lastSyncAt ? lastSyncAt.toLocaleTimeString(undefined, { hour12: false }) : '—';

  return (
    <div id="arail" className={auditOpen ? 'open' : ''}>
      <div className="ar-strip" onClick={toggle} data-btn-id="BTN-AUDIT-RAIL-TOGGLE">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="3 2"/><circle cx="12" cy="12" r="11"/>
        </svg>
        <div className="ar-lbl">Live</div>
        <div className="ar-chev">◀</div>
      </div>

      <div className="ar-pnl">
        <div className="ar-hd">
          <div className="ar-htxt" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#4ADE80', boxShadow: '0 0 6px #4ADE80',
              flexShrink: 0, display: 'inline-block',
              animation: auditOpen ? 'ap 2s ease-in-out infinite' : 'none',
            }} />
            Live Commentary
          </div>
          <button className="ar-ebtn agent-only" onClick={exportCsv} data-btn-id="BTN-AUDIT-RAIL-EXPORT">Export</button>
        </div>

        <div className="ar-flt">
          <div className="ar-srch">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
            </svg>
            <input placeholder="Filter events…" data-field-id="FIELD-AUDIT-FILTER"/>
          </div>
        </div>

        <div className="ar-bdy">
          {visibleLogs.length === 0
            ? <div style={{ padding: '8px 10px', fontSize: 9, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>
                {clearedAt ? 'Stream cleared — waiting for new events…' : 'Loading audit stream…'}
              </div>
            : visibleLogs.map((row, i) => (
                <div key={i} className="ar-row">
                  <div className="ar-ico" style={{ background: row.bg }}>{IC_AUDIT[row.ic]}</div>
                  <div className="ar-det">
                    <div className="ar-ttl">{row.ttl}</div>
                    <div className="ar-met">{row.met}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <span className={`ar-bdg ${row.bc}`}>{row.bt}</span>
                    <span className="ar-ts">{row.ts}</span>
                  </div>
                </div>
              ))}
        </div>

        <div className="ar-ft">
          <div className="ar-ft-t">Live · last sync {lastSyncTxt}</div>
          <div className="ar-ft-b">
            <button className="ar-fbt agent-only" onClick={() => setClearedAt(new Date())} data-btn-id="BTN-AUDIT-RAIL-CLEAR">Clear</button>
            <button className="ar-fbt agent-only" onClick={fetchLogs} data-btn-id="BTN-AUDIT-RAIL-REFRESH">Refresh</button>
          </div>
        </div>
      </div>
    </div>
  );
}
