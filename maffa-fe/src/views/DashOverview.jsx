// views/DashOverview.jsx — HR Ops: dense engagement analytics
import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { KPI, Badge, BarRow, Histogram, Alert } from '../components/UI.jsx';
import { DashboardAPI, EventsAPI, SurveysAPI } from '../services/api.js';

const MONTH_LBL = (ym) => {
  if (!ym) return '';
  const [, m] = ym.split('-');
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m, 10) - 1] || ym;
};

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

export default function DashOverview() {
  const [m, setM] = useState(null);
  const [trend, setTrend] = useState([]);
  const [surveyList, setSurveyList] = useState([]);
  const [eventList, setEventList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      DashboardAPI.overview(),
      DashboardAPI.monthlyTrend().catch(() => ({ items: [] })),
      SurveysAPI.list({ limit: 200 }).catch(() => ({ items: [] })),
      EventsAPI.list({ limit: 200 }).catch(() => ({ items: [] })),
    ]).then(([ov, tr, sv, ev]) => {
      setM(ov);
      setTrend(tr.items || []);
      setSurveyList(sv.items || []);
      setEventList(ev.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !m) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--n4)' }}>Loading dashboard…</div>;

  const sBuckets = { approved: 0, pending: 0, draft: 0 };
  for (const s of surveyList) {
    const a = (s.approved_status || '').toLowerCase();
    if (a === 'approved') sBuckets.approved++;
    else if (a === 'pending') sBuckets.pending++;
    else sBuckets.draft++;
  }
  const surveyData = [
    { name: 'Approved', value: sBuckets.approved, fill: '#5929d0' },
    { name: 'Pending',  value: sBuckets.pending,  fill: '#f59e0b' },
    { name: 'Draft',    value: sBuckets.draft,    fill: '#94a3b8' },
  ];

  const eBuckets = { published: 0, draft: 0, completed: 0 };
  for (const e of eventList) {
    const st = (e.status || '').toLowerCase();
    if (st === 'published') eBuckets.published++;
    else if (st === 'completed') eBuckets.completed++;
    else eBuckets.draft++;
  }
  const eventData = [
    { name: 'Published', value: eBuckets.published, fill: '#5929d0' },
    { name: 'Draft',     value: eBuckets.draft,     fill: '#94a3b8' },
    { name: 'Completed', value: eBuckets.completed, fill: '#16A34A' },
  ];

  const histData = (trend.length ? trend : [{ ym: '', count: 0 }])
    .slice(-6)
    .map(t => ({ label: MONTH_LBL(t.ym), value: t.count || 0 }));

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR OPS DASHBOARD</div>
        <div className="ban-title">Engagement Overview</div>
        <div className="ban-desc">Real-time KPIs across Recognition, Events, Surveys, and Knowledge Base.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPI cls="kp"  lbl="Total Employees"        val={`${m.employees?.total ?? 0}`}                                                            sub={`${m.employees?.active_pct ?? 0}% active`}                                                                                trend="Live" tcls="up" />
        <KPI cls="kok" lbl="Active Employees"       val={`${m.employees?.active ?? 0}`}                                                           sub="working + new joiners"                                                                                                    trend="Live" tcls="up" />
        <KPI cls="kcy" lbl="On Leave"               val={`${m.employees?.on_leave_pct ?? 0}%`}                                                    sub={`${m.employees?.on_leave ?? 0} employees`}                                                                                trend="Live" tcls="up" />
        <KPI cls="kp"  lbl="Recognition Delivery"   val={`${m.recognition.delivery_rate_pct}%`}                                                   sub={`${m.recognition.delivered}/${m.recognition.total}`}                                                                      trend="Live" tcls="up" />
        <KPI cls="kok" lbl="Event Participation"    val={`${m.events.participation_pct}%`}                                                        sub={`${m.events.unique_participants ?? m.events.registrations} unique`}                                                       trend="Live" tcls="up" />
        <KPI cls="kcy" lbl="Survey Response"        val={`${m.surveys.response_pct}%`}                                                            sub={`${m.surveys.responses} responses`}                                                                                       trend="Live" tcls="up" />
        <KPI cls="kpk" lbl="Query Resolution"       val={`${m.queries.resolution_pct}%`}                                                          sub={`${m.queries.high_confidence_count + m.queries.partial_count}/${m.queries.total}`}                                        trend="Live" tcls="up" />
        <KPI cls="kwn" lbl="Avg Approval Time"      val={`${m.approvals.avg_decision_hours ?? 0}h`}                                               sub="across decided items"                                                                                                     trend="Live" tcls="up" />
        <KPI cls="ker" lbl="SLA Breached"           val={`${(m.approvals.breached ?? 0) + (m.escalations.breached ?? 0)}`}                        sub={`${m.approvals.breached ?? 0} appr · ${m.escalations.breached ?? 0} esc`}                                                trend="Live" tcls={(m.approvals.breached + m.escalations.breached) > 0 ? "dn" : "up"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartCard title="Confidence Distribution" badge="3-Tier">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: 'High (≥0.90)', value: m.queries.high_confidence_count, fill: '#16A34A' },
                  { name: 'Partial (0.60–0.89)', value: m.queries.partial_count, fill: '#E4902E' },
                  { name: 'Low (<0.60)', value: m.queries.low_count, fill: '#DC2626' },
                ]}
                cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                paddingAngle={2} dataKey="value"
              />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="SLA Health" badge="Live" padded={false}>
          <div style={{ maxHeight: 180 }}>
            <BarRow lbl="Approvals Pending"   pct={Math.min(100, (m.approvals.pending || 0) * 10)}    color="var(--p)"  val={`${m.approvals.pending || 0}`} />
            <BarRow lbl="Approvals Breached"  pct={Math.min(100, (m.approvals.breached || 0) * 25)}   color="var(--er)" val={`${m.approvals.breached || 0}`} />
            <BarRow lbl="Escalations Open"    pct={Math.min(100, (m.escalations.open || 0) * 20)}     color="var(--wn)" val={`${m.escalations.open || 0}`} />
            <BarRow lbl="Escalations Breached" pct={Math.min(100, (m.escalations.breached || 0) * 25)} color="var(--er)" val={`${m.escalations.breached || 0}`} />
          </div>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartCard title="Recognition Delivery">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Delivered', value: m.recognition.delivered || 0, fill: '#16A34A' },
                  { name: 'Failed',    value: m.recognition.failed || 0,    fill: '#DC2626' },
                  { name: 'Pending',   value: m.recognition.pending || 0,   fill: '#94a3b8' },
                ]}
                cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                paddingAngle={2} dataKey="value"
              />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Survey Status">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={surveyData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Event Status">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={eventData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartCard title="Department Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={m.departments || []} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Bar dataKey="count" fill="#5929d0" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Employment Status">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Active', value: m.employees?.active ?? 0, fill: '#16A34A' },
                  { name: 'On Leave', value: m.employees?.on_leave ?? 0, fill: '#22D3EE' },
                  { name: 'Terminated', value: m.employees?.terminated ?? 0, fill: '#94A3B8' },
                ]}
                cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={2} dataKey="value"
              />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Monthly Engagement Trend" badge="last 6 months" padded={false}>
        <div style={{ maxHeight: 180 }}>
          {histData.length && histData.some(d => d.value > 0)
            ? <Histogram data={histData} barColor="var(--p)" />
            : <div style={{ fontSize: 10, color: 'var(--n4)' }}>No audit log volume yet.</div>}
        </div>
      </ChartCard>

      {m.approvals.breached > 0 && (
        <div style={{ marginTop: 12 }}>
          <Alert cls="alert-er" icon="⚠" text={`${m.approvals.breached} approval(s) past 24h SLA — auto-escalation pending`} sub="Hit 'Auto-Escalate Breached' on the Approval Queue." />
        </div>
      )}
    </>
  );
}
