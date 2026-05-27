// components/Window.jsx
import { useRef, useState } from 'react';
import { useDesktop } from '../context/DesktopContext.jsx';
import { APPS } from '../data/index.js';
import { TitleSVG, NavIcon } from './UI.jsx';
import ViewRouter from '../views/index.jsx';

const WOLF_MARK = (
  <div className="wsmark" style={{ background: 'linear-gradient(135deg,#5929d0,#CF008B)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
      <polygon points="5,14 10,4 15,14" fill="white" fillOpacity=".95"/>
      <polygon points="17,14 22,4 27,14" fill="white" fillOpacity=".95"/>
      <path d="M5 14 Q5 22 16 26 Q27 22 27 14 Z" fill="white" fillOpacity=".95"/>
      <circle cx="12" cy="17" r="1.4" fill="#5929d0"/>
      <circle cx="20" cy="17" r="1.4" fill="#5929d0"/>
      <ellipse cx="16" cy="20.5" rx="1.6" ry="1.1" fill="#5929d0"/>
    </svg>
  </div>
);

export default function WindowComp({ appId }) {
  const {
    windows, closeWindow, minimizeWindow, focusWindow,
    updateWindowPos, updateWindowSize, toggleFullscreen, maximizeWindow,
    toast,
  } = useDesktop();

  const win = windows[appId];
  const cfg = APPS[appId];
  const daRef = useRef(document.getElementById('da'));

  // Active view state
  const [activeView, setActiveView] = useState(cfg?.def || null);

  if (!win || !cfg) return null;
  if (win.minimized) return null;

  const { x, y, w, h, zIndex, focused, fullscreen } = win;

  // ── Drag ──────────────────────────────────────────────────────
  const dragState = useRef({ on: false, sx: 0, sy: 0, sl: 0, st: 0 });

  const onTitlebarMouseDown = (e) => {
    if (e.target.closest('.wctl') || e.target.closest('.wfsb')) return;
    if (fullscreen) return;
    const el = document.getElementById('win-' + appId);
    if (!el) return;
    dragState.current = { on: true, sx: e.clientX, sy: e.clientY, sl: el.offsetLeft, st: el.offsetTop };
    focusWindow(appId, cfg.title);
    e.preventDefault();

    const onMove = (e) => {
      if (!dragState.current.on) return;
      const { sx, sy, sl, st } = dragState.current;
      const nx = sl + e.clientX - sx;
      const ny = st + e.clientY - sy;
      updateWindowPos(appId, nx, ny);
    };
    const onUp = () => {
      dragState.current.on = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Resize ────────────────────────────────────────────────────
  const resizeState = useRef({ on: false, sx: 0, sy: 0, sw: 0, sh: 0 });

  const onResizeMouseDown = (e) => {
    const el = document.getElementById('win-' + appId);
    if (!el) return;
    resizeState.current = { on: true, sx: e.clientX, sy: e.clientY, sw: el.offsetWidth, sh: el.offsetHeight };
    e.preventDefault();
    e.stopPropagation();

    const onMove = (e) => {
      if (!resizeState.current.on) return;
      const { sx, sy, sw, sh } = resizeState.current;
      updateWindowSize(appId, Math.max(400, sw + e.clientX - sx), Math.max(280, sh + e.clientY - sy));
    };
    const onUp = () => {
      resizeState.current.on = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // ── Styles ────────────────────────────────────────────────────
  const style = fullscreen
    ? { left: 0, top: 0, width: '100%', height: '100%', zIndex: zIndex || 100, borderRadius: 0 }
    : { left: x, top: y, width: w, height: h, zIndex: zIndex || 100 };

  // ── Nav sidebar ───────────────────────────────────────────────
  const hasSidebar = !!cfg.nav;

  const switchView = (vId, btn) => {
    setActiveView(vId);
  };

  return (
    <div
      id={`win-${appId}`}
      className={`window${focused ? ' focused' : ''}${fullscreen ? ' fullscreen' : ''}`}
      style={style}
      onMouseDown={() => focusWindow(appId, cfg.title)}
    >
      {/* Titlebar */}
      <div className="wb" onMouseDown={onTitlebarMouseDown}>
        <div className="wctl">
          <div className="wc cl" onClick={(e) => { e.stopPropagation(); closeWindow(appId); }} data-btn-id={`BTN-WINDOW-CLOSE-${appId}`} />
          <div className="wc mn" onClick={(e) => { e.stopPropagation(); minimizeWindow(appId); toast(`${cfg.title} Minimised`, 'Click Restore All or the icon to reopen'); }} data-btn-id={`BTN-WINDOW-MIN-${appId}`} />
          <div className="wc mx" onClick={(e) => { e.stopPropagation(); toggleFullscreen(appId, cfg); }} data-btn-id={`BTN-WINDOW-MAX-${appId}`} />
        </div>
        <div className="wt">
          <TitleSVG id={appId} />
          <span style={{ marginLeft: 6 }}>{cfg.title}</span>
        </div>
      </div>

      {/* Body */}
      <div className="win-body">
        {hasSidebar ? (
          <div className="wlayout">
            {/* Sidebar */}
            <div className="wside">
              <div className="wslogo">
                {WOLF_MARK}
                <div>
                  <div className="wsbrand">Wolf Pack</div>
                  <div className="wssub">maffa.ai</div>
                </div>
              </div>
              <div className="wsnav">
                {cfg.nav.map((item, i) =>
                  item.s
                    ? <div key={i} className="wns">{item.s}</div>
                    : (
                      <button
                        key={item.id}
                        className={`wnb${activeView === item.id ? ' act' : ''}`}
                        onClick={() => switchView(item.id)}
                        data-btn-id={`NAV-${appId.toUpperCase()}-${item.id.toUpperCase()}`}
                      >
                        <NavIcon id={item.ico} />
                        <span>{item.lbl}</span>
                      </button>
                    )
                )}
              </div>
              <div className="wsfoot">
                <div className="avchip">{cfg.av}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--n1)' }}>{cfg.name}</div>
                  <div style={{ fontSize: 8, color: 'var(--n4)' }}>{cfg.role}</div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="wmain">
              <div className="wtopbar">
                <div className="wttl">
                  {cfg.nav.find(n => n.id === activeView)?.lbl || ''}
                </div>
              </div>
              <div className="wct">
                <ViewRouter viewId={activeView} appId={appId} />
              </div>
            </div>
          </div>
        ) : (
          /* Full-window apps (no sidebar) */
          <ViewRouter viewId={appId} appId={appId} />
        )}
      </div>

      {/* Resize handle */}
      <div className="win-resize" onMouseDown={onResizeMouseDown} />
    </div>
  );
}
