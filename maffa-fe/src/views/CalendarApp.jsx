import { useEffect, useState, useMemo } from 'react';
import { EventsAPI } from '../services/api.js';

export default function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      setLoading(true);
      EventsAPI.list({ approved_status: 'approved', limit: 100 })
        .then(d => mounted && setEvents(d.items || []))
        .finally(() => mounted && setLoading(false));
    };
    load();
    const id = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfMonth; i++) arr.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter(e => {
        const eDate = e.event_date || (e.event_start_time || '').slice(0, 10);
        return eDate === dStr;
      });
      arr.push({ day: d, dateStr: dStr, events: dayEvents });
    }
    while (arr.length % 7 !== 0) arr.push({ day: null });
    return arr;
  }, [month, year, daysInMonth, firstDayOfMonth, events]);

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px' }}>
        <div>
          <div className="ban-lbl">Event Calendar</div>
          <div className="ban-title" style={{ fontSize: 24 }}>{monthNames[month]} {year}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-o btn-sm" onClick={prevMonth} data-btn-id="BTN-CALENDAR-PREV">&larr;</button>
          <button className="btn btn-o btn-sm" onClick={() => setCurrentDate(new Date())} data-btn-id="BTN-CALENDAR-TODAY">Today</button>
          <button className="btn btn-o btn-sm" onClick={nextMonth} data-btn-id="BTN-CALENDAR-NEXT">&rarr;</button>
        </div>
      </div>

      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        background: 'var(--n7)',
        border: '1px solid var(--n7)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--n7)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: '10px', textAlign: 'center', fontSize: 11, fontWeight: 700, background: 'var(--n8)', color: 'var(--n4)', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(80px, 1fr)', gap: 1, background: 'var(--n7)', overflowY: 'auto' }}>
          {days.map((d, i) => {
            const today = new Date();
            const isToday = d.day && d.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const visibleEvents = d.day ? d.events.slice(0, 3) : [];
            const hiddenCount = d.day ? Math.max(0, d.events.length - visibleEvents.length) : 0;
            return (
              <div key={i} style={{
                  background: d.day ? '#fff' : 'var(--n8)',
                  padding: 8,
                  minHeight: 80,
                  minWidth: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
              }}>
                {d.day && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? '#fff' : 'var(--n1)',
                        background: isToday ? 'var(--p)' : 'transparent',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {d.day}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {visibleEvents.map(e => (
                        <div key={e.event_id} style={{
                            fontSize: 9,
                            padding: '2px 4px',
                            borderRadius: 3,
                            background: 'var(--pl)',
                            color: 'var(--p)',
                            marginBottom: 2,
                            borderLeft: '2px solid var(--p)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }} title={e.event_name}>
                          {e.event_name}
                        </div>
                      ))}
                      {hiddenCount > 0 && (
                        <div style={{ fontSize: 9, color: 'var(--n4)', padding: '1px 4px' }}>
                          +{hiddenCount} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
