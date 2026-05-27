// views/index.jsx — View router
// Maps a viewId/appId to the correct view component
import PortalHome       from './PortalHome.jsx';
import PortalSurvey     from './PortalSurvey.jsx';
import PortalKB         from './PortalKB.jsx';
import AdminEvents      from './AdminEvents.jsx';
import AdminSurvey      from './AdminSurvey.jsx';
import AdminTemplates   from './AdminTemplates.jsx';
import AdminDrafts      from './AdminDrafts.jsx';
import DashOverview     from './DashOverview.jsx';
import DashRecog        from './DashRecog.jsx';
import DashKB           from './DashKB.jsx';
import Approval         from './Approval.jsx';
import Escalation       from './Escalation.jsx';
import Audit            from './Audit.jsx';
import DashboardApp     from './DashboardApp.jsx';
import CalendarApp      from './CalendarApp.jsx';
import ClockApp         from './ClockApp.jsx';

const VIEW_MAP = {
  'portal-home':       PortalHome,
  'portal-survey':     PortalSurvey,
  'portal-kb':         PortalKB,
  'admin-events':      AdminEvents,
  'admin-survey':      AdminSurvey,
  'admin-templates':   AdminTemplates,
  'admin-drafts':      AdminDrafts,
  'dash-overview':     DashOverview,
  'dash-recog':        DashRecog,
  'dash-kb':           DashKB,
  'approval':          Approval,
  'escalation':        Escalation,
  'audit':             Audit,
  // full-window apps
  'dashboard':         DashboardApp,
  'calendar':          CalendarApp,
  'clockapp':          ClockApp,
};

export default function ViewRouter({ viewId, appId }) {
  const Component = VIEW_MAP[viewId];
  if (!Component) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--n5)' }}>Loading…</div>;
  return <Component appId={appId} />;
}
