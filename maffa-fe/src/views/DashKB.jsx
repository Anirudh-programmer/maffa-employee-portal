// views/DashKB.jsx — HR Ops: KB & Queries (3-band breakdown + articles by category)
import { useEffect, useState } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { KPI, Badge, BarRow } from '../components/UI.jsx';
import { DashboardAPI, KBAPI } from '../services/api.js';

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

export default function DashKB() {
  const [data, setData] = useState(null);
  const [queries, setQueries] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      DashboardAPI.kbAnalytics(),
      KBAPI.queries({ limit: 50 }),
      KBAPI.articles({ limit: 200 }).catch(() => ({ items: [] })),
    ]).then(([d, q, a]) => {
      setData(d);
      setQueries(q.items || []);
      setArticles(a.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--n4)' }}>Loading…</div>;

  const total = data.total_queries || 1;
  const high = data.bands.find(b => b.label.startsWith('High'))?.count || 0;
  const partial = data.bands.find(b => b.label.startsWith('Partial'))?.count || 0;
  const low = data.bands.find(b => b.label.startsWith('Low'))?.count || 0;

  const bandData = [
    { name: 'High (≥0.90)',        value: high,    fill: '#16A34A' },
    { name: 'Partial (0.60–0.89)', value: partial, fill: '#E4902E' },
    { name: 'Low (<0.60)',         value: low,     fill: '#DC2626' },
  ];
  const bandTotal = high + partial + low;

  const catCounts = {};
  for (const a of articles) {
    const c = a.category || 'Uncategorised';
    catCounts[c] = (catCounts[c] || 0) + 1;
  }
  const catTop = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8);
  const catMax = catTop.length ? Math.max(...catTop.map(([, c]) => c)) : 1;

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR OPS DASHBOARD</div>
        <div className="ban-title">KB &amp; Queries</div>
        <div className="ban-desc">Three-tier confidence breakdown — High ≥0.90 · Partial 0.60–0.89 · Low &lt;0.60.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
        <KPI cls="kok" lbl="High Confidence" val={`${high}`}    sub="≥ 0.90 score" trend="Live" tcls="up" />
        <KPI cls="kcy" lbl="Partial Match"   val={`${partial}`} sub="0.60–0.89"   trend="Live" tcls="up" />
        <KPI cls="ker" lbl="Routed to HR"    val={`${low}`}     sub="< 0.60"      trend="Live" tcls="dn" />
        <KPI cls="kp"  lbl="Resolution Rate" val={`${Math.round(((high + partial) / total) * 100)}%`} sub="auto + partial" trend="Live" tcls="up" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <ChartCard title="Confidence Band Distribution" badge="3-Tier">
          {bandTotal > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={bandData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ fontSize: 10, color: 'var(--n4)' }}>No queries yet.</div>
          )}
        </ChartCard>
        <ChartCard title="Articles by Category" badge="top 8" padded={false}>
          <div style={{ maxHeight: 180 }}>
            {catTop.length === 0
              ? <div style={{ fontSize: 10, color: 'var(--n4)' }}>No articles loaded.</div>
              : catTop.map(([cat, c]) => (
                  <BarRow
                    key={cat}
                    lbl={cat}
                    pct={Math.round((c / catMax) * 100)}
                    color="var(--cy)"
                    val={`${c}`}
                    w="130px"
                  />
                ))}
          </div>
        </ChartCard>
      </div>

      <div className="card">
        <div className="card-hd" style={{ padding: '8px 12px' }}><div className="card-title" style={{ fontSize: 11 }}>Top Queries (last 12)</div></div>
        <table className="tbl">
          <thead><tr><th>Query</th><th>Score</th><th>Band</th><th>Outcome</th><th>When</th></tr></thead>
          <tbody>
            {queries.slice(0, 12).map(q => (
              <tr key={q.query_id}>
                <td><strong>{q.query_text}</strong></td>
                <td>{Math.round((q.confidence_score || 0) * 100)}%</td>
                <td>
                  <Badge cls={q.confidence_band === 'high' ? 'bok' : q.confidence_band === 'partial' ? 'bcy' : 'ber'}>
                    {q.confidence_band}
                  </Badge>
                </td>
                <td>{q.escalation_flag ? <Badge cls="ber">Escalated</Badge> : <Badge cls="bgr">Resolved</Badge>}</td>
                <td style={{ fontSize: 9, color: 'var(--n4)' }}>{(q.created_at || '').slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
