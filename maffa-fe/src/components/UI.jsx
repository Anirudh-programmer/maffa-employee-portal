// components/UI.jsx — Shared atomic UI components
// These mirror the H.* helpers from the original HTML exactly

export function Badge({ cls, children }) {
  return <span className={`badge ${cls}`}>{children}</span>;
}

export function SDot({ cls, children }) {
  return (
    <span className="sdot">
      <span className={`dot ${cls}`} />
      {children}
    </span>
  );
}

export function BarRow({ lbl, pct, color, val, w = '90px' }) {
  return (
    <div className="bar-r">
      <div className="bar-lbl" style={{ width: w }}>{lbl}</div>
      <div className="bar-trk">
        <div className="bar-f" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-val">{val}</div>
    </div>
  );
}

export function Alert({ cls, icon, text, sub }) {
  return (
    <div className={`alert ${cls}`}>
      <span className="al-ico">{icon}</span>
      <div>
        <div className="al-txt">{text}</div>
        {sub && <div className="al-sub">{sub}</div>}
      </div>
    </div>
  );
}

const KPI_ICONS = {
  kp:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--p)"    strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>,
  kpk: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  kcy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--cy)"   strokeWidth="2" strokeLinecap="round"><rect x="2" y="1" width="12" height="14" rx="1.5"/></svg>,
  kok: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ok)"   strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  kwn: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--wn)"   strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>,
  ker: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--er)"   strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  knv: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nv)"   strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
};
const KPI_IBGS = {
  kp:'var(--pl)', kpk:'var(--pkl)', kcy:'var(--cyl)', kok:'var(--okl)',
  kwn:'var(--wnl)', ker:'var(--erl)', knv:'#DBEAFE',
};

export function KPI({ cls, lbl, val, sub, trend, tcls }) {
  return (
    <div className={`kpi ${cls}`}>
      <div className="kpi-ico" style={{ background: KPI_IBGS[cls] || 'var(--pl)' }}>
        {KPI_ICONS[cls]}
      </div>
      <div className="kpi-lbl">{lbl}</div>
      <div className="kpi-val">{val}</div>
      <div className="kpi-sub">{sub}</div>
      <div className={`kpi-trend ${tcls}`}>{trend}</div>
    </div>
  );
}

// Nav icon SVGs — matches SVI() from original
export function NavIcon({ id }) {
  const s = (d) => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
  const paths = {
    home:  '<path d="M1 7l7-5 7 5"/><rect x="2" y="7" width="12" height="8" rx="1.5"/>',
    surv:  '<rect x="2" y="1" width="12" height="14" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h4"/>',
    kb:    '<circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11v.5"/>',
    cal:   '<rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v3M11 1v3M2 7h12"/>',
    bell:  '<path d="M8 1a5 5 0 015 5c0 3 1.5 4 1.5 5H1.5C1.5 10 3 9 3 6a5 5 0 015-5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/>',
    draft: '<rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 6h6M5 9h4"/>',
    esc:   '<path d="M3 8h10M9 4l4 4-4 4"/>',
    grid:  '<rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
    check: '<path d="M2 8l4 4 8-7"/>',
    lock:  '<rect x="3" y="7" width="10" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/>',
  };
  return s(paths[id] || '<circle cx="8" cy="8" r="4"/>');
}

// Window title SVGs
export function TitleSVG({ id }) {
  const svgs = {
    portal:     <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></>,
    events:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    overview:   <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    dashboard:  <><line x1="4" y1="19" x2="20" y2="19"/><rect x="6" y="11" width="3" height="6" rx="1"/><rect x="11" y="8" width="3" height="9" rx="1"/><rect x="16" y="5" width="3" height="12" rx="1"/></>,
    'audit-app':<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    approval:   <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    escalation: <><path d="M3 8h10M9 4l4 4-4 4"/></>,
    calendar:   <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    clockapp:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  };
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {svgs[id] || svgs.overview}
    </svg>
  );
}

// Pie Chart Component
export function PieChart({ data, colors, size = 100 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;
  const segments = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const radius = size / 2;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = radius + radius * Math.cos(startRad);
    const y1 = radius + radius * Math.sin(startRad);
    const x2 = radius + radius * Math.cos(endRad);
    const y2 = radius + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    currentAngle = endAngle;
    
    return { path, color: colors[i % colors.length], label: d.label, percentage };
  });
  
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} stroke="#fff" strokeWidth="1" />
        ))}
      </svg>
      <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: seg.color }}></div>
            <span style={{ color: 'var(--n3)', fontWeight: '500' }}>{seg.label}: {seg.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Donut Chart Component
export function DonutChart({ data, colors, size = 100 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = -90;
  const innerRadius = size / 3;
  const outerRadius = size / 2;
  
  const segments = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1o = size / 2 + outerRadius * Math.cos(startRad);
    const y1o = size / 2 + outerRadius * Math.sin(startRad);
    const x2o = size / 2 + outerRadius * Math.cos(endRad);
    const y2o = size / 2 + outerRadius * Math.sin(endRad);
    
    const x1i = size / 2 + innerRadius * Math.cos(endRad);
    const y1i = size / 2 + innerRadius * Math.sin(endRad);
    const x2i = size / 2 + innerRadius * Math.cos(startRad);
    const y2i = size / 2 + innerRadius * Math.sin(startRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${x1o} ${y1o} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2i} ${y2i} Z`;
    
    currentAngle = endAngle;
    
    return { path, color: colors[i % colors.length], label: d.label, percentage };
  });
  
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => (
          <path key={i} d={seg.path} fill={seg.color} stroke="#fff" strokeWidth="1" />
        ))}
      </svg>
      <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: seg.color }}></div>
            <span style={{ color: 'var(--n3)', fontWeight: '500' }}>{seg.label}: {seg.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Histogram Component
export function Histogram({ data, color, barColor, label, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '50px', fontSize: '9px', color: 'var(--n3)', fontWeight: '500', whiteSpace: 'nowrap' }}>{item.label}</div>
          <div style={{ flex: 1, height: '20px', background: 'var(--n8)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%',
              width: `${(item.value / max) * 100}%`,
              background: barColor || color,
              borderRadius: '3px',
              transition: 'width 0.3s'
            }} />
          </div>
          <div style={{ width: '40px', fontSize: '9px', fontWeight: '700', color: 'var(--n2)', textAlign: 'right' }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}
