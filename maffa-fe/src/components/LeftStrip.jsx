// components/LeftStrip.jsx
import { useEffect, useRef } from 'react';
import { useDesktop } from '../context/DesktopContext.jsx';
import { Calendar, StickyNote } from 'lucide-react';

export default function LeftStrip({ onOpenApp, onNewNote }) {
  const { windows } = useDesktop();
  const hhRef = useRef(null), mhRef = useRef(null), shRef = useRef(null);

  // Animate analog clock hands
  useEffect(() => {
    function tick() {
      const now = new Date();
      const hh = now.getHours(), mm = now.getMinutes(), ss = now.getSeconds();
      const hDeg = (hh % 12) / 12 * 360 + (mm / 60) * 30 - 90;
      const mDeg = mm / 60 * 360 - 90;
      const sDeg = ss / 60 * 360 - 90;
      const setHand = (ref, deg, len) => {
        if (!ref.current) return;
        const r = deg * Math.PI / 180;
        ref.current.setAttribute('x2', 24 + len * Math.cos(r));
        ref.current.setAttribute('y2', 24 + len * Math.sin(r));
      };
      setHand(hhRef, hDeg, 8.5);
      setHand(mhRef, mDeg, 12.5);
      setHand(shRef, sDeg, 14.5);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isOpen = (id) => !!windows[id];

  return (
    <div id="lstrip">
      {/* Analog Clock */}
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '7px 0 9px', width: 62, borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: 4, cursor: 'pointer' }}
        onClick={() => onOpenApp('clockapp')}
        title="Clock, Alarm & Timer"
        data-btn-id="BTN-LEFTSTRIP-CLOCK"
      >
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="21" fill="rgba(255,255,255,.07)" stroke="rgba(255,255,255,.22)" strokeWidth="1.5"/>
          <line x1="24" y1="4.5" x2="24" y2="9"   stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="43.5" y1="24" x2="39" y2="24" stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="24" y1="43.5" x2="24" y2="39" stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="4.5" y1="24" x2="9" y2="24"   stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="36.7" y1="7.3"  x2="35"   y2="9.6"  stroke="rgba(255,255,255,.2)" strokeWidth="1" strokeLinecap="round"/>
          <line x1="40.7" y1="36.7" x2="38.4" y2="35"   stroke="rgba(255,255,255,.2)" strokeWidth="1" strokeLinecap="round"/>
          <line x1="7.3"  y1="36.7" x2="9.6"  y2="35"   stroke="rgba(255,255,255,.2)" strokeWidth="1" strokeLinecap="round"/>
          <line x1="11.3" y1="7.3"  x2="13"   y2="9.6"  stroke="rgba(255,255,255,.2)" strokeWidth="1" strokeLinecap="round"/>
          <line ref={hhRef} x1="24" y1="24" x2="24" y2="15" stroke="white"                   strokeWidth="2.8" strokeLinecap="round"/>
          <line ref={mhRef} x1="24" y1="24" x2="24" y2="11" stroke="rgba(255,255,255,.75)"   strokeWidth="2"   strokeLinecap="round"/>
          <line ref={shRef} x1="24" y1="24" x2="24" y2="9"  stroke="#22D3EE"                 strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="24" cy="24" r="2.5" fill="white"/>
        </svg>
      </div>

      {/* Calendar */}
      <div className="li-btn" style={{ background: 'linear-gradient(145deg,#0E2E89,#38bdf8)' }} onClick={() => onOpenApp('calendar')} data-btn-id="BTN-LEFTSTRIP-CALENDAR">
        <Calendar size={22} strokeWidth={1.8} color="#fff" />
        <div className="tip">Calendar</div>
        <div className={`lrundot${isOpen('calendar') ? ' on' : ''}`} />
      </div>

      <div className="lsep" />

      {/* New Note */}
      <div className="li-btn" style={{ background: 'linear-gradient(145deg,#475569,#64748b)' }} onClick={onNewNote} title="Create New Note" data-btn-id="BTN-LEFTSTRIP-NEW-NOTE">
        <StickyNote size={22} strokeWidth={1.8} color="#fff" />
        <div className="tip">New Note</div>
      </div>
    </div>
  );
}
