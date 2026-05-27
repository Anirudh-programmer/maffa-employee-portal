// components/MenuBar.jsx
import { useState, useEffect, useRef } from 'react';
import { useDesktop } from '../context/DesktopContext.jsx';
import { useLiveStats } from '../hooks/useLiveStats.js';
import { Lock, FileText } from 'lucide-react';
import { APPS } from '../data/index.js';

export default function MenuBar() {
  const { mbAppTitle, restoreAll, closeAll, openWindow, focusWindow, windows, toast } = useDesktop();
  const { online, overview, approvals } = useLiveStats();
  const slaCount = approvals?.breached ?? 0;
  const pending = approvals?.pending ?? 0;
  const queries = overview?.queries?.total ?? 0;
  const [clock, setClock] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const menubarRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!menubarRef.current?.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', () => setOpenMenu(null));
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id) => setOpenMenu(prev => prev === id ? null : id);

  const openIds = Object.keys(windows);

  return (
    <div id="menubar" ref={menubarRef}>
      <div className="mb-left">
        {/* Logo */}
        <div className="mb-logo" style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg,#5929d0,#CF008B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="17" height="17" viewBox="0 0 32 32" fill="none">
            <polygon points="5,14 10,4 15,14" fill="white" fillOpacity=".92"/>
            <polygon points="17,14 22,4 27,14" fill="white" fillOpacity=".92"/>
            <path d="M5 14 Q5 22 16 26 Q27 22 27 14 Z" fill="white" fillOpacity=".92"/>
            <path d="M12 19 Q16 23 20 19" fill="rgba(89,41,208,.3)"/>
            <circle cx="12" cy="17" r="1.5" fill="#5929d0"/>
            <circle cx="20" cy="17" r="1.5" fill="#5929d0"/>
            <ellipse cx="16" cy="20.5" rx="1.8" ry="1.2" fill="#5929d0"/>
          </svg>
        </div>

        <div className="mb-m bold" id="mb-app">{mbAppTitle}</div>

        {/* File menu */}
        <div className={`mb-m${openMenu === 'file' ? ' open' : ''}`} onClick={() => toggle('file')} data-btn-id="BTN-MENUBAR-FILE">File</div>
        {openMenu === 'file' && (
          <div className="mdd show" style={{ left: 56 }}>
            <div className="mdi" onClick={() => { toast('Audit Export Started', 'Full audit log queued — CSV & PDF'); setOpenMenu(null); }} data-btn-id="BTN-MENUBAR-EXPORT-AUDIT">Export Audit Log</div>
          </div>
        )}

        {/* View menu */}
        <div className={`mb-m${openMenu === 'view' ? ' open' : ''}`} onClick={() => toggle('view')} data-btn-id="BTN-MENUBAR-VIEW">View</div>
        {openMenu === 'view' && (
          <div className="mdd show" style={{ left: 86 }}>
            <div className="mdi" onClick={() => { restoreAll(); setOpenMenu(null); }} data-btn-id="BTN-MENUBAR-RESTORE-ALL">Restore Minimised</div>
            <div className="mds" />
            <div className="mdi" onClick={() => { openWindow('portal',    APPS['portal']);    setOpenMenu(null); }} data-btn-id="BTN-MENUBAR-OPEN-PORTAL">Employee View</div>
            <div className="mdi" onClick={() => { openWindow('events',    APPS['events']);    setOpenMenu(null); }} data-btn-id="BTN-MENUBAR-OPEN-EVENTS">HR Coordinator View</div>
            <div className="mdi" onClick={() => { openWindow('overview',  APPS['overview']);  setOpenMenu(null); }} data-btn-id="BTN-MENUBAR-OPEN-OVERVIEW">HR Ops Manager View</div>
            <div className="mdi" onClick={() => { openWindow('audit-app', APPS['audit-app']); setOpenMenu(null); }} data-btn-id="BTN-MENUBAR-OPEN-AUDIT">Compliance Reviewer View</div>
          </div>
        )}

        {/* Window menu */}
        <div className={`mb-m${openMenu === 'window' ? ' open' : ''}`} onClick={() => toggle('window')} data-btn-id="BTN-MENUBAR-WINDOW">Window</div>
        {openMenu === 'window' && (
          <div className="mdd show" style={{ left: 116 }}>
            {openIds.length === 0
              ? <div className="mdi off">No open windows</div>
              : openIds.map(id => {
                  const cfg = APPS[id];
                  const label = cfg?.title || id;
                  return (
                    <div key={id} className="mdi" onClick={() => { focusWindow(id, cfg?.title); setOpenMenu(null); }} data-btn-id={`BTN-MENUBAR-FOCUS-${id.toUpperCase()}`}>
                      {label}
                    </div>
                  );
                })
            }
            <div className="mds" />
            <div className="mdi" onClick={() => { closeAll(); setOpenMenu(null); }} data-btn-id="BTN-MENUBAR-CLOSE-ALL">Close All</div>
          </div>
        )}
      </div>

      <div className="mb-right">
        <div className={`mb-chip ${online ? 'ok' : 'er'}`}>
          <div className="ld" />{online ? 'Agent Active' : 'Disconnected'}
        </div>
        <div className="mb-chip">
          <Lock size={11} color="#94A3B8" strokeWidth={1.8} />
          100%
        </div>
        <div className={`mb-chip ${slaCount > 0 ? 'wn' : ''}`}><div className="ld" />{slaCount} SLA</div>
        <div className="mb-chip">
          <FileText size={11} color="#94A3B8" strokeWidth={1.8} />
          {pending} Pending · {queries} Queries
        </div>
        <div id="mb-clock">{clock}</div>
      </div>
    </div>
  );
}
