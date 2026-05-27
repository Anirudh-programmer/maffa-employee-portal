// views/DashRecog.jsx — HR Ops: Recognition & Events log + channel + event-status charts
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge, KPI, BarRow } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { RecognitionAPI, DashboardAPI, EventsAPI } from '../services/api.js';

const C_CHAN = ['#5929d0', '#22c55e', '#f59e0b', '#94a3b8'];

function ChartCard({ title, badge, children, padded = true }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-hd" style={{ padding: '8px 12px' }}>
        <div className="card-title" style={{ fontSize: 11 }}>{title}</div>
        {badge && <Badge cls="bp">{badge}</Badge>}
      </div>
      <div
        className="card-bd"
        style={padded
          ? { padding: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
          : { padding: 10, flex: 1 }}
      >
        {children}
      </div>
    </div>
  );
}

export default function DashRecog() {
  const { toast } = useDesktop();
  const [log, setLog] = useState([]);
  const [overview, setOverview] = useState(null);
  const [channels, setChannels] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    Promise.all([
      RecognitionAPI.log({ limit: 100 }),
      DashboardAPI.overview(),
      DashboardAPI.recogAnalytics().catch(() => ({ by_channel: {} })),
      EventsAPI.list({ limit: 200 }).catch(() => ({ items: [] })),
    ]).then(([l, o, ra, ev]) => {
      setLog(l.items || []);
      setOverview(o);
      setChannels(ra.by_channel || {});
      setEvents(ev.items || []);
    }).finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const runCycle = async () => {
    try {
      const r = await RecognitionAPI.runCycle();
      toast('Recognition Cycle', `${r.triggered_count} triggered · ${r.skipped_count} skipped · ${r.flagged_count} flagged`);
      reload();
    } catch (e) {
      toast('Error', e.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--n4)' }}>Loading…</div>;

  const rec = overview?.recognition || {};

  const chanData = Object.entries(channels).map(([ch, statuses]) => ({
    name: ch,
    value: Object.values(statuses).reduce((s, c) => s + (c || 0), 0),
  })).filter(d => d.value > 0);

  const evBuckets = { draft: 0, published: 0, completed: 0 };
  for (const e of events) {
    const st = (e.status || '').toLowerCase();
    if (evBuckets[st] != null) evBuckets[st]++;
  }
  const evMax = Math.max(1, ...Object.values(evBuckets));

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR OPS DASHBOARD</div>
        <div className="ban-title">Recognition &amp; Events</div>
        <div className="ban-desc">Recognition delivery log — preference-aware, employment-status-aware.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPI cls="kp"  lbl="Delivered" val={`${rec.delivered ?? 0}`} sub="success"           trend="Live" tcls="up" />
        <KPI cls="ker" lbl="Failed"    val={`${rec.failed ?? 0}`}    sub="all retries done"  trend="Live" tcls="dn" />
        <KPI cls="kcy" lbl="Pending"   val={`${rec.pending ?? 0}`}   sub="in queue"          trend="Live" tcls="up" />
        <KPI cls="kok" lbl="Total"     val={`${rec.total ?? 0}`}     sub="all events"        trend="Live" tcls="up" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartCard title="Delivery Channels">
          {chanData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={chanData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                  {chanData.map((_, i) => <Cell key={i} fill={C_CHAN[i % C_CHAN.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 10, color: 'var(--n4)' }}>No channel deliveries yet — run the recognition cycle.</div>
          )}
        </ChartCard>
        <ChartCard title="Events by Status" padded={false}>
          <div style={{ maxHeight: 180 }}>
            <BarRow lbl="Published"  pct={Math.round((evBuckets.published  / evMax) * 100)} color="var(--p)"  val={`${evBuckets.published}`}  w="100px" />
            <BarRow lbl="Draft"      pct={Math.round((evBuckets.draft      / evMax) * 100)} color="var(--n5)" val={`${evBuckets.draft}`}      w="100px" />
            <BarRow lbl="Completed"  pct={Math.round((evBuckets.completed  / evMax) * 100)} color="var(--ok)" val={`${evBuckets.completed}`}  w="100px" />
          </div>
        </ChartCard>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'flex-end' }}>
        <button className="btn btn-p btn-sm agent-only" onClick={runCycle} data-btn-id="BTN-RUN-CYCLE-DASH">⟳ Run Recognition Cycle</button>
      </div>

      <div className="card">
        <div className="card-hd" style={{ padding: '8px 12px' }}>
          <div className="card-title" style={{ fontSize: 11 }}>Recognition Log</div>
          <Badge cls="bp">6 columns</Badge>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Event</th>
              <th>Trigger Date</th>
              <th>Delivery</th>
              <th>Validation Flag</th>
              <th>Employment Status</th>
            </tr>
          </thead>
          <tbody>
            {log.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 16, color: 'var(--n4)' }}>No recognition events yet — click 'Run Recognition Cycle'</td></tr>}
            {log.map(r => (
              <tr key={r.event_id}>
                <td><strong>{r.employee_name}</strong></td>
                <td><Badge cls="bp">{r.event_type}</Badge></td>
                <td>{r.trigger_date}</td>
                <td>
                  <Badge cls={r.delivery_status === 'success' ? 'bok' : r.delivery_status === 'failed' ? 'ber' : 'bgr'}>
                    {r.delivery_status}
                  </Badge>
                </td>
                <td>
                  {r.validation_flag
                    ? <Badge cls="bcy">{r.validation_flag}</Badge>
                    : <span style={{ color: 'var(--n5)', fontSize: 9 }}>—</span>}
                </td>
                <td>
                  <Badge cls={r.employment_status === 'active' ? 'bok' : r.employment_status === 'on_leave' ? 'bcy' : r.employment_status === 'terminated' ? 'ber' : 'bp'}>
                    {r.employment_status || 'active'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
