// views/PortalHome.jsx — My Portal: greeting + events + notifications + preferences
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { EventsAPI, NotificationsAPI, EmployeesAPI } from '../services/api.js';

const CURRENT_EMP_ID = 1;

export default function PortalHome() {
  const { toast } = useDesktop();
  const [me, setMe] = useState(null);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const reloadMe = () => EmployeesAPI.get(CURRENT_EMP_ID).then(setMe);

  useEffect(() => {
    let mounted = true;
    const load = () => Promise.all([
      EventsAPI.list({ approved_status: 'approved', employee_id: CURRENT_EMP_ID, limit: 20 }),
      NotificationsAPI.list({ employee_id: CURRENT_EMP_ID, limit: 20 }),
      EmployeesAPI.get(CURRENT_EMP_ID),
    ]).then(([ev, nf, emp]) => {
      if (!mounted) return;
      setEvents(ev.items || []);
      setNotifications(nf.items || []);
      setMe(emp);
    }).catch(() => {}).finally(() => mounted && setLoading(false));
    load();
    const id = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const upcoming = useMemo(() => events.filter(e => e.status === 'published').slice(0, 3), [events]);
  const topNotifs = useMemo(() => notifications.slice(0, 4), [notifications]);

  const register = async (eventId) => {
    try {
      await EventsAPI.register(eventId, CURRENT_EMP_ID);
      toast('Registered', 'Registration confirmed.');
      setEvents(prev => prev.map(ev => ev.event_id === eventId ? { ...ev, registered: true } : ev));
      EventsAPI.list({ approved_status: 'approved', employee_id: CURRENT_EMP_ID, limit: 20 }).then(d => setEvents(d.items || []));
    } catch (e) {
      if ((e.message || '').toLowerCase().includes('already registered')) {
        setEvents(prev => prev.map(ev => ev.event_id === eventId ? { ...ev, registered: true } : ev));
        return;
      }
      toast('Cannot Register', e.message);
    }
  };

  const togglePref = async (key, value) => {
    try {
      const updated = await EmployeesAPI.setNotifyPrefs(CURRENT_EMP_ID, { [key]: value });
      setMe(updated);
      toast('Preferences updated', `${prettyKey(key)}: ${value ? 'On' : 'Off'}`);
    } catch (e) {
      toast('Error', e.message);
    }
  };

  const setRecogPref = async (preference) => {
    try {
      const updated = await EmployeesAPI.setRecogPref(CURRENT_EMP_ID, preference);
      setMe(updated);
      toast('Recognition Preference', preference);
    } catch (e) {
      toast('Error', e.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--n4)' }}>Loading…</div>;

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">EMPLOYEE PORTAL</div>
        <div className="ban-title">Hello, {me?.name?.split(' ')[0] || 'there'} 👋</div>
        <div className="ban-desc">{me?.role || ''} · {me?.department || ''} · {me?.location || ''}</div>
        <div className="ban-chips">
          <span className="ban-chip">{upcoming.length} Upcoming</span>
          <span className="ban-chip">{notifications.length} Notifications</span>
        </div>
      </div>

      <div className="g32">
        <div>
          <div className="card mb12">
            <div className="card-hd"><div className="card-title">Upcoming Events</div><Badge cls="bp">Live</Badge></div>
            <div className="card-bd">
              {upcoming.length === 0 && <div style={{ fontSize: 10, color: 'var(--n4)' }}>No upcoming events.</div>}
              {upcoming.map(ev => (
                <div key={ev.event_id} style={{ padding: '8px 0', borderBottom: '1px solid var(--n7)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--n1)' }}>{ev.event_name}</div>
                      <div style={{ fontSize: 9, color: 'var(--n4)', marginTop: 3 }}>
                        {ev.event_date || '–'} · {ev.target_audience || 'All'}
                      </div>
                    </div>
                    {ev.registered
                      ? (
                        <button className="btn btn-ok btn-sm" disabled style={{ cursor: 'default', opacity: 0.85 }} data-btn-id={`BTN-REGISTERED-${ev.event_id}`}>
                          ✓ Registered
                        </button>
                      )
                      : (
                        <button className="btn btn-p btn-sm agent-only" onClick={() => register(ev.event_id)} data-btn-id={`BTN-REGISTER-${ev.event_id}`}>
                          Register
                        </button>
                      )
                    }
                  </div>
                  {ev.description && <div style={{ fontSize: 10, color: 'var(--n3)', marginTop: 4 }}>{ev.description}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title">Recent Notifications</div><Badge cls="bgr">{notifications.length}</Badge></div>
            <div className="card-bd">
              {topNotifs.length === 0 && <div style={{ fontSize: 10, color: 'var(--n4)' }}>No new notifications.</div>}
              {topNotifs.map(n => (
                <div key={n.notification_id} style={{ padding: '6px 0', borderBottom: '1px solid var(--n7)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--n1)' }}>{n.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--n4)' }}>{n.message}</div>
                  <div style={{ fontSize: 9, color: 'var(--n5)', marginTop: 2 }}>{(n.channel || '').toUpperCase()} · {(n.notification_type || '')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card mb12">
            <div className="card-hd">
              <div className="card-title">Notification Preferences</div>
            </div>
            <div className="card-bd">
              {[
                { key: 'notify_recognition', label: 'Birthdays & Anniversaries', toggleId: 'TOGGLE-PORTAL-NOTIFY-RECOGNITION' },
                { key: 'notify_events',      label: 'Engagement Events',         toggleId: 'TOGGLE-PORTAL-NOTIFY-EVENTS' },
                { key: 'notify_surveys',     label: 'Survey Invitations',        toggleId: 'TOGGLE-PORTAL-NOTIFY-SURVEYS' },
              ].map(({ key, label, toggleId }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--n7)' }}>
                  <div style={{ fontSize: 11 }}>{label}</div>
                  <Toggle on={!!me?.[key]} onClick={() => togglePref(key, !me?.[key])} toggleId={toggleId} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-title">Recognition Preference</div>
            </div>
            <div className="card-bd">
              <div style={{ fontSize: 10, color: 'var(--n4)', marginBottom: 8 }}>
                Choose how birthday/anniversary messages are delivered to you.
              </div>
              {['public', 'private', 'off'].map(p => (
                <div
                  key={p}
                  onClick={() => setRecogPref(p)}
                  style={{
                    padding: '8px 12px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
                    border: me?.recognition_preference === p ? '1px solid var(--p)' : '1px solid var(--n7)',
                    background: me?.recognition_preference === p ? 'rgba(89, 41, 208, .1)' : 'transparent',
                    fontSize: 11, color: 'var(--n1)',
                  }}
                  data-btn-id={`BTN-RECOG-PREF-${p.toUpperCase()}`}
                >
                  <strong style={{ textTransform: 'capitalize' }}>{p}</strong>
                  <span style={{ fontSize: 9, color: 'var(--n4)', marginLeft: 6 }}>
                    {p === 'public' && '— delivered + visible to team'}
                    {p === 'private' && '— delivered + audited (no PII)'}
                    {p === 'off' && '— no recognition messages'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function prettyKey(k) {
  return k.replace(/^notify_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function Toggle({ on, onClick, toggleId }) {
  return (
    <div
      onClick={onClick}
      data-toggle-id={toggleId}
      style={{
        width: 32, height: 18, borderRadius: 999, cursor: 'pointer',
        background: on ? 'var(--p)' : 'var(--n7)', position: 'relative',
        transition: 'background .15s',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left .15s',
      }} />
    </div>
  );
}
