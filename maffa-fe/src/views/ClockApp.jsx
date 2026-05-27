import React, { useState, useEffect, useRef } from 'react';
import { useDesktop } from '../context/DesktopContext.jsx';
import { Clock, AlarmClock, Hourglass, Globe, Plus, Trash2, Play, Pause, RotateCcw } from 'lucide-react';

export default function ClockApp() {
  const { toast } = useDesktop();
  const [activeTab, setActiveTab] = useState('clock');
  const [now, setNow] = useState(new Date());

  // Alarm State
  const [alarms, setAlarms] = useState([
    { id: 1, time: '08:00', label: 'Morning Standup', enabled: true },
    { id: 2, time: '17:00', label: 'Daily Sync', enabled: false },
  ]);
  const [newAlarmTime, setNewAlarmTime] = useState('09:00');

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerInput, setTimerInput] = useState(10); // Minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // World Clock State
  const worldClocks = [
    { city: 'London', tz: 'Europe/London' },
    { city: 'New York', tz: 'America/New_York' },
    { city: 'Tokyo', tz: 'Asia/Tokyo' },
  ];

  // Update Clock
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNow(d);
      
      // Check Alarms
      const timeStr = d.toTimeString().slice(0, 5);
      const triggered = alarms.find(a => a.enabled && a.time === timeStr && d.getSeconds() === 0);
      if (triggered) {
        toast('Alarm Triggered', `Time to: ${triggered.label || 'Wake up!'}`);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [alarms, toast]);

  // Timer Logic
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            toast('Timer Finished', 'Your countdown has ended.');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timerSeconds, toast]);

  const startTimer = () => {
    if (timerSeconds === 0) setTimerSeconds(timerInput * 60);
    setIsTimerRunning(true);
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addAlarm = () => {
    setAlarms([...alarms, { id: Date.now(), time: newAlarmTime, label: 'New Alarm', enabled: true }]);
  };

  const toggleAlarm = (id) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  const getCityTime = (tz) => {
    return new Date().toLocaleTimeString([], { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="clock-app" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8f9fc', minHeight: 0 }}>
      {/* Tabs */}
      <div className="clock-tabs" style={{ display: 'flex', background: '#eee', padding: '4px', borderBottom: '1px solid #ddd' }}>
        {[
          { id: 'clock', icon: Clock, label: 'Clock' },
          { id: 'world', icon: Globe, label: 'World' },
          { id: 'alarm', icon: AlarmClock, label: 'Alarm' },
          { id: 'timer', icon: Hourglass, label: 'Timer' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            data-btn-id={`BTN-CLOCK-TAB-${t.id}`}
            style={{
              flex: 1, padding: '10px 4px', border: 'none', borderRadius: '6px',
              background: activeTab === t.id ? '#fff' : 'transparent',
              color: activeTab === t.id ? '#0E2E89' : '#666',
              boxShadow: activeTab === t.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              fontSize: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="clock-content" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {activeTab === 'clock' && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, color: '#0E2E89', marginBottom: '4px', letterSpacing: '-1px' }}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            
            <div style={{ marginTop: '40px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#aaa', marginBottom: '4px', textTransform: 'uppercase' }}>Current Location</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: 600 }}>{Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
            </div>
          </div>
        )}

        {activeTab === 'world' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {worldClocks.map(c => (
              <div key={c.city} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#fff', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{c.city}</div>
                  <div style={{ fontSize: '10px', color: '#999' }}>{c.tz.split('/')[0]}</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0E2E89' }}>{getCityTime(c.tz)}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'alarm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                data-field-id="FIELD-CLOCK-ALARM-TIME"
                style={{ flex: 1, background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', color: '#111', fontSize: '14px', outline: 'none' }}
              />
              <button onClick={addAlarm} data-btn-id="BTN-CLOCK-ALARM-ADD" style={{ background: '#0E2E89', border: 'none', borderRadius: '8px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform='scale(1)'}>
                <Plus size={22} color="#fff" />
              </button>
            </div>

            {alarms.map(alarm => (
              <div key={alarm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#fff', borderRadius: '12px', border: '1px solid #eee', opacity: alarm.enabled ? 1 : 0.6, transition: 'all 0.2s' }}>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: alarm.enabled ? '#111' : '#888' }}>{alarm.time}</div>
                  <div style={{ fontSize: '10px', color: '#999', fontWeight: 600 }}>{alarm.label}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    onClick={() => toggleAlarm(alarm.id)}
                    data-toggle-id={`TOGGLE-CLOCK-ALARM-${alarm.id}`}
                    style={{
                        width: '40px', height: '22px', background: alarm.enabled ? '#0E2E89' : '#ddd',
                        borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ width: '18px', height: '18px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: alarm.enabled ? '20px' : '2px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                  </div>
                  <Trash2 size={18} color="#ccc" style={{ cursor: 'pointer' }} onClick={() => deleteAlarm(alarm.id)} data-btn-id={`BTN-CLOCK-ALARM-DELETE-${alarm.id}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'timer' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '68px', fontWeight: 800, color: '#0E2E89', margin: '10px 0 20px', letterSpacing: '-2px' }}>
              {formatTime(timerSeconds)}
            </div>

            {!isTimerRunning && timerSeconds === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                <input
                  type="number"
                  value={timerInput}
                  onChange={(e) => setTimerInput(parseInt(e.target.value) || 0)}
                  data-field-id="FIELD-CLOCK-TIMER-MINUTES"
                  style={{ width: '64px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', color: '#111', textAlign: 'center', fontSize: '18px', fontWeight: 700 }}
                />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#aaa', textTransform: 'uppercase' }}>Minutes</span>
              </div>
            ) : (
                <div style={{ height: '70px' }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  data-btn-id="BTN-CLOCK-TIMER-PLAY"
                  style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0E2E89', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,46,137,0.3)' }}
                >
                  <Play size={28} color="#fff" fill="#fff" />
                </button>
              ) : (
                <button
                  onClick={() => setIsTimerRunning(false)}
                  data-btn-id="BTN-CLOCK-TIMER-PAUSE"
                  style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff', border: '2px solid #0E2E89', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Pause size={28} color="#0E2E89" fill="#0E2E89" />
                </button>
              )}

              <button
                onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }}
                data-btn-id="BTN-CLOCK-TIMER-RESET"
                style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eee', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <RotateCcw size={28} color="#666" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
