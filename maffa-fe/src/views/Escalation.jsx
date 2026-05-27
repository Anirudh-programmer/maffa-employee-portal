// views/Escalation.jsx — HR Ops: Escalation Queue (48h SLA)
import { useEffect, useState } from 'react';
import { Badge, KPI } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { EscalationsAPI, KBAPI } from '../services/api.js';

export default function Escalation() {
  const { toast } = useDesktop();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, breached: 0 });
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});  // { id: text }
  const [queryTexts, setQueryTexts] = useState({});  // { query_id: query_text }

  const reload = () => {
    setLoading(true);
    Promise.all([
      EscalationsAPI.list({ limit: 50 }),
      EscalationsAPI.stats(),
      KBAPI.queries({ limit: 50 }),
    ]).then(([list, st, qs]) => {
      setItems(list.items || []);
      setStats(st || {});
      const qmap = {};
      (qs.items || []).forEach(q => { qmap[q.query_id] = q.query_text; });
      setQueryTexts(qmap);
    }).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const action = async (id, type) => {
    const body = {};
    if (type === 'send_response' || type === 'create_kb_article') {
      body.response_text = responses[id] || '';
      if (!body.response_text.trim()) {
        toast('Response required', 'Please enter a resolution.');
        return;
      }
    }
    if (type === 'create_kb_article') {
      body.article_payload = { title: `Resolved from escalation #${id}`, content: body.response_text };
    }
    try {
      await EscalationsAPI.resolve(id, type, body);
      toast('Action recorded', type.replace(/_/g, ' '));
      setResponses(prev => { const n = { ...prev }; delete n[id]; return n; });
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR OPS DASHBOARD</div>
        <div className="ban-title">Escalation Queue</div>
        <div className="ban-desc">Unresolved KB queries (&lt; 0.60 confidence) escalated to HR — 48h SLA.</div>
        <div className="ban-chips">
          <span className="ban-chip">{stats.open || 0} Open</span>
          <span className="ban-chip">{stats.in_progress || 0} In Progress</span>
          <span className="ban-chip">{stats.breached || 0} Breached</span>
        </div>
      </div>

      <div className="g4 mb12">
        <KPI cls="kp"  lbl="Open"        val={`${stats.open || 0}`}        sub="awaiting response" trend="Live" tcls="up" />
        <KPI cls="kcy" lbl="In Progress" val={`${stats.in_progress || 0}`} sub="being resolved"    trend="Live" tcls="up" />
        <KPI cls="ker" lbl="Breached"    val={`${stats.breached || 0}`}    sub="past 48h SLA"      trend="Live" tcls="dn" />
        <KPI cls="kok" lbl="Closed"      val={`${stats.closed || 0}`}      sub="total resolved"    trend="Live" tcls="up" />
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title">Active Escalations</div></div>
        <div className="card-bd">
          {loading && <div style={{ textAlign: 'center', padding: 16 }}>Loading…</div>}
          {!loading && items.length === 0 && <div style={{ textAlign: 'center', padding: 16, color: 'var(--n4)' }}>No escalations.</div>}
          {items.map(item => {
            const breached = item.sla_breached || (typeof item.sla_remaining_hours === 'number' && item.sla_remaining_hours < 0);
            const urgent = !breached && typeof item.sla_remaining_hours === 'number' && item.sla_remaining_hours <= 8;
            const closed = item.status === 'closed';
            return (
              <div key={item.id} style={{ borderBottom: '1px solid var(--n7)', padding: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--n1)' }}>
                      {item.ticket_ref}
                      <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--n4)', marginLeft: 6 }}>
                        — Query #{item.query_id}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--n3)', marginTop: 3, fontStyle: 'italic' }}>
                      "{queryTexts[item.query_id] || 'Loading query text…'}"
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--n4)', marginTop: 3 }}>
                      Submitted {(item.created_at || '').slice(0, 16).replace('T', ' ')} · Assigned to ID {item.assigned_to}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {closed && <Badge cls="bok">Closed</Badge>}
                    {!closed && breached && <Badge cls="ber">SLA Breached</Badge>}
                    {!closed && urgent && !breached && <Badge cls="bcy">Urgent</Badge>}
                    {!closed && !urgent && !breached && <Badge cls="bgr">{item.sla_remaining_hours ?? '–'}h left</Badge>}
                  </div>
                </div>
                {item.resolution_text && (
                  <div style={{ fontSize: 10, color: 'var(--n3)', padding: 8, background: 'var(--n8)', borderRadius: 4, marginBottom: 6 }}>
                    <strong>Resolution:</strong> {item.resolution_text}
                  </div>
                )}
                {!closed && (
                  <>
                    <textarea
                      placeholder="Resolution text or response…"
                      value={responses[item.id] || ''}
                      onChange={e => setResponses({ ...responses, [item.id]: e.target.value })}
                      style={{ width: '100%', minHeight: 50, padding: 6, fontSize: 10, border: '1px solid var(--n7)', borderRadius: 4, background: 'var(--n8)', color: 'var(--n1)', marginBottom: 6 }}
                      data-field-id={`FIELD-ESCALATION-RESOLUTION-${item.id}`}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-o btn-sm agent-only" onClick={() => action(item.id, 'escalate_further')} data-btn-id={`BTN-ESC-FURTHER-${item.id}`}>Escalate Further</button>
                      <button className="btn btn-o btn-sm agent-only" onClick={() => action(item.id, 'create_kb_article')} data-btn-id={`BTN-CREATE-KB-${item.id}`}>+ Create KB Article</button>
                      <button className="btn btn-p btn-sm agent-only" onClick={() => action(item.id, 'send_response')} data-btn-id={`BTN-SEND-${item.id}`}>Send Response</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
