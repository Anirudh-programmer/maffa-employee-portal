import { useState, useRef } from 'react';
import { useDesktop } from '../context/DesktopContext.jsx';

export default function TaskWidget({ onFocus, zIndex }) {
  const { tasks, toggleTask, removeTask, addTask, toast } = useDesktop();
  const [pos, setPos] = useState({ x: 10, y: 230 });
  const dragRef = useRef({ on: false, sx: 0, sy: 0, sl: 0, st: 0 });

  const onMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('.task-list-scroll')) return;
    dragRef.current = { on: true, sx: e.clientX, sy: e.clientY, sl: pos.x, st: pos.y };
    onFocus?.();
    e.preventDefault();

    const onMove = (ee) => {
      if (!dragRef.current.on) return;
      const { sx, sy, sl, st } = dragRef.current;
      setPos({ x: sl + ee.clientX - sx, y: st + ee.clientY - sy });
    };
    const onUp = () => {
      dragRef.current.on = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const barGrad =
    pct === 100 ? 'linear-gradient(90deg,#4ADE80,#22D3EE)' :
    pct >= 60   ? 'linear-gradient(90deg,#4ADE80,#A855F7)' :
    pct >= 30   ? 'linear-gradient(90deg,#FCD34D,#A855F7)' :
                  'linear-gradient(90deg,#F87171,#A855F7)';

  const handleAdd = () => {
    const txt = prompt('New task:');
    if (txt?.trim()) { addTask(txt); }
  };

  const handleToggle = (id) => {
    const t = tasks.find(t => t.id === id);
    toggleTask(id);
    if (t && !t.done) toast('Task Complete', `"${t.txt.substring(0, 40)}…" marked done`);
  };

  return (
    <div
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: 210, borderRadius: 10, overflow: 'hidden', zIndex: zIndex || 60,
        boxShadow: '3px 4px 18px rgba(0,0,0,.45)',
        background: '#1e1b2e', border: '1px solid rgba(255,255,255,.08)',
      }}
      onMouseDown={onMouseDown}
    >
      {/* Header bar */}
      <div
        style={{
          height: 32, background: 'linear-gradient(135deg,#5929d0,#CF008B)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px', userSelect: 'none', flexShrink: 0, cursor: 'move'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2" strokeLinecap="round">
            <path d="M9 11l3 3 8-8"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.23 0 2.4.25 3.46.7"/>
          </svg>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.9)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Today's Tasks</span>
        </div>
        <div style={{
          background: pct === 100 ? 'rgba(74,222,128,.3)' : 'rgba(255,255,255,.2)',
          borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#fff',
        }}>{pct}%</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,.1)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: barGrad, width: `${pct}%`, transition: 'width .4s cubic-bezier(.4,0,.2,1)', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px 5px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,.45)' }}>{done} of {total} done</span>
        <button
          onClick={handleAdd}
          data-btn-id="BTN-TASK-ADD"
          style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)', borderRadius: 5, padding: '2px 8px', fontSize: 9, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}
          onMouseOver={e => e.target.style.background = 'rgba(255,255,255,.2)'}
          onMouseOut={e => e.target.style.background = 'rgba(255,255,255,.1)'}
        >+ Add</button>
      </div>

      {/* Task list */}
      <div className="task-list-scroll" style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
        {tasks.map(t => (
          <TaskRow key={t.id} task={t} onToggle={handleToggle} onRemove={removeTask} />
        ))}
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle, onRemove }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid rgba(255,255,255,.05)', background: hovered ? 'rgba(255,255,255,.04)' : 'transparent', transition: 'background .1s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={() => onToggle(task.id)}
        data-toggle-id={`TOGGLE-TASK-${task.id}`}
        style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${task.done ? '#4ADE80' : 'rgba(255,255,255,.25)'}`, background: task.done ? '#4ADE80' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
      >
        {task.done && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l3 3 5-5"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: 9.5, color: task.done ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.82)', textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4, flex: 1 }}>{task.txt}</span>
      <div
        onClick={() => onRemove(task.id)}
        data-btn-id={`BTN-TASK-REMOVE-${task.id}`}
        style={{ opacity: hovered ? 1 : 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,.4)', fontSize: 11, flexShrink: 0 }}
        onMouseOver={e => e.currentTarget.style.color = '#F87171'}
        onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,.4)'}
      >✕</div>
    </div>
  );
}
