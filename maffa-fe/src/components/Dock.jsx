// components/Dock.jsx
import { useDesktop } from '../context/DesktopContext.jsx';
import { APP_GRADS } from '../data/index.js';
import { UserRound, Briefcase, BarChart3, ShieldCheck, LayoutDashboard, Eye } from 'lucide-react';

import { TitleSVG } from './UI.jsx';

function DockIcon({ grad, children, appId, onOpen, noPop, tooltip, dotId, popup, btnId }) {
  const { windows } = useDesktop();
  const isOpen = !!windows[appId];
  return (
    <div className={`di${noPop ? ' no-pop' : ''}`} onClick={() => onOpen(appId)} data-btn-id={btnId}>
      <div className="dico" style={{ background: grad }}>{children}</div>
      <div className={`ddot${isOpen ? '' : ' off'}`} id={dotId} />
      <div className="dtt">{tooltip}</div>
      {popup}
    </div>
  );
}

export default function Dock({ onOpen }) {
  const { minimizeAll, recentApps } = useDesktop();

  return (
    <>
      <div id="dock-peek" />
      <div id="dock-wrap">
        <div id="dock">
          {/* 1. Employee Portal */}
          <DockIcon appId="portal" onOpen={onOpen} noPop grad="linear-gradient(145deg,#CF008B,#A855F7)" tooltip="Employee Portal" dotId="dd-portal" btnId="BTN-DOCK-PORTAL">
            <UserRound size={26} strokeWidth={1.8} color="#fff" />
          </DockIcon>

          {/* 2. HR Coordinator */}
          <DockIcon appId="events" onOpen={onOpen} noPop grad="linear-gradient(145deg,#5929d0,#6B8EF0)" tooltip="HR Coordinator" dotId="dd-events" btnId="BTN-DOCK-EVENTS">
            <Briefcase size={26} strokeWidth={1.8} color="#fff" />
          </DockIcon>

          {/* 3. HR Ops Dashboard */}
          <DockIcon appId="overview" onOpen={onOpen} noPop grad="linear-gradient(145deg,#0E2E89,#22D3EE)" tooltip="HR Ops Dashboard" dotId="dd-overview" btnId="BTN-DOCK-OVERVIEW">
            <BarChart3 size={26} strokeWidth={1.8} color="#fff" />
          </DockIcon>

          {/* 4. Compliance Reviewer */}
          <DockIcon appId="audit-app" onOpen={onOpen} noPop grad="linear-gradient(145deg,#0E2E89,#5929d0)" tooltip="Compliance Reviewer" dotId="dd-audit-app" btnId="BTN-DOCK-AUDIT">
            <ShieldCheck size={26} strokeWidth={1.8} color="#fff" />
          </DockIcon>

          {/* 5. Dashboard */}
          <DockIcon appId="dashboard" onOpen={onOpen} noPop grad="linear-gradient(145deg,#0E2E89,#38bdf8)" tooltip="Dashboard" dotId="dd-dashboard" btnId="BTN-DOCK-DASHBOARD">
            <LayoutDashboard size={26} strokeWidth={1.8} color="#fff" />
          </DockIcon>

          {/* 6. Recent Apps */}
          {recentApps.length > 0 && <div className="dsep" />}
          {recentApps.map((ra) => (
            <div key={ra.id} className="di" onClick={() => onOpen(ra.id)} data-btn-id={`BTN-DOCK-RECENT-${ra.id}`}>
              <div className="dico" style={{ background: APP_GRADS[ra.id] || 'rgba(255,255,255,0.1)', color: 'white' }}>
                <TitleSVG id={ra.id} />
              </div>
              <div className="ddot off" />
              <div className="dtt">Recent: {ra.title}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
