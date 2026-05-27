// views/Approval.jsx — HR Ops Manager: Approval Queue (24h SLA)
import { useEffect, useState } from 'react';
import { Badge, KPI } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { ApprovalsAPI } from '../services/api.js';

const REVIEWER_ID = 3;  // Rajesh — HR Ops Manager

export default function Approval() {
  const { toast } = useDesktop();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ pending: 0, urgent: 0, breached: 0, avg_review_hours: 0 });
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});  // { approval_id: comment string }

  const reload = () => {
    setLoading(true);
    Promise.all([
      ApprovalsAPI.list({ limit: 50 }),
      ApprovalsAPI.stats(),
    ]).then(([list, st]) => {
      setItems(list.items || []);
      setStats(st || {});
    }).catch(e => toast('Error', e.message)).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const decide = async (id, decision) => {
    const c = comments[id] || '';
    if (decision === 'rejected' && !c.trim()) {
      toast('Comments required', 'Please add a reason for rejection.');
      return;
    }
    try {
      await ApprovalsAPI.decide(id, decision, c);
      toast(decision === 'approved' ? 'Approved' : 'Returned', `Approval #${id} ${decision}`);
      setComments(prev => { const n = { ...prev }; delete n[id]; return n; });
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  const escalateBreached = async () => {
    try {
      const r = await ApprovalsAPI.escalateBreached();
      toast('Auto-Escalation', `${r.escalated} item(s) escalated to Head of HR.`);
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  const pending = items.filter(i => i.status === 'pending');

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR OPS DASHBOARD</div>
        <div className="ban-title">Approval Queue</div>
        <div className="ban-desc">Content approval gate — 24h SLA · auto-escalation to Head of HR.</div>
        <div className="ban-chips">
          <span className="ban-chip">{stats.pending || 0} Pending</span>
          <span className="ban-chip">{stats.urgent || 0} Urgent (≤4h)</span>
          <span className="ban-chip">{stats.breached || 0} Breached</span>
        </div>
      </div>

      <div className="g4 mb12">
        <KPI cls="kp"  lbl="Pending"  val={`${stats.pending || 0}`}  sub="awaiting decision"  trend="Live" tcls="up" />
        <KPI cls="kcy" lbl="Urgent"   val={`${stats.urgent || 0}`}   sub="≤ 4 hours left"     trend="Live" tcls="up" />
        <KPI cls="ker" lbl="Breached" val={`${stats.breached || 0}`} sub="past 24h SLA"       trend="Live" tcls="dn" />
        <KPI cls="kok" lbl="Avg Review" val={`${stats.avg_review_hours || 0}h`} sub="for decided items" trend="Live" tcls="up" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-o btn-sm agent-only" onClick={escalateBreached} data-btn-id="BTN-ESC-BREACHED">
          ⚠ Auto-Escalate Breached
        </button>
      </div>

      <div className="card">
        <div className="card-hd"><div className="card-title">Pending Items</div></div>
        <div className="card-bd">
          {loading && <div style={{ textAlign: 'center', padding: 16 }}>Loading…</div>}
          {!loading && pending.length === 0 && <div style={{ textAlign: 'center', padding: 16, color: 'var(--n4)' }}>No items pending — queue clear.</div>}
          {pending.map(item => {
            const breached = item.sla_breached || (typeof item.sla_remaining_hours === 'number' && item.sla_remaining_hours < 0);
            const urgent = !breached && typeof item.sla_remaining_hours === 'number' && item.sla_remaining_hours <= 4;
            return (
              <div key={item.approval_id} style={{ borderBottom: '1px solid var(--n7)', padding: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--n1)' }}>{item.title || `${item.content_type} #${item.content_id}`}</div>
                    <div style={{ fontSize: 10, color: 'var(--n4)', marginTop: 3 }}>
                      {item.content_type.toUpperCase()} · Submitted {(item.created_at || '').slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {breached && <Badge cls="ber">SLA Breached</Badge>}
                    {urgent && <Badge cls="bcy">Urgent</Badge>}
                    {!breached && !urgent && <Badge cls="bgr">{item.sla_remaining_hours}h left</Badge>}
                  </div>
                </div>
                {item.comments && <div style={{ fontSize: 11, color: 'var(--n3)', padding: 8, background: 'var(--n8)', borderRadius: 4, marginBottom: 6 }}>{item.comments}</div>}
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  <textarea
                    placeholder="Comments (required for return)…"
                    value={comments[item.approval_id] || ''}
                    onChange={e => setComments({ ...comments, [item.approval_id]: e.target.value })}
                    style={{ flex: 1, minHeight: 32, padding: 6, fontSize: 10, border: '1px solid var(--n7)', borderRadius: 4, background: 'var(--n8)', color: 'var(--n1)' }}
                    data-field-id={`FIELD-APPROVAL-COMMENTS-${item.approval_id}`}
                  />
                  <button className="btn btn-er btn-sm agent-only" onClick={() => decide(item.approval_id, 'rejected')} data-btn-id={`BTN-REJECT-${item.approval_id}`}>Return</button>
                  <button className="btn btn-ok btn-sm agent-only" onClick={() => decide(item.approval_id, 'approved')} data-btn-id={`BTN-APPROVE-${item.approval_id}`}>Approve</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
