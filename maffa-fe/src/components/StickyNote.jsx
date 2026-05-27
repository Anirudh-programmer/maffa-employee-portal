import { useState, useRef } from 'react';

export default function StickyNote({ id, title, content, color, barColor, initialX, initialY, onDelete, zIndex, onFocus }) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const dragRef = useRef({ on: false, sx: 0, sy: 0, sl: 0, st: 0 });

  const onMouseDown = (e) => {
    if (e.target.closest('.sn-close') || e.target.tagName === 'TEXTAREA') return;
    dragRef.current = { on: true, sx: e.clientX, sy: e.clientY, sl: pos.x, st: pos.y };
    onFocus?.(id);
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

  return (
    <div
      className="sn"
      style={{ left: pos.x, top: pos.y, background: color, zIndex: zIndex || 50 }}
      onMouseDown={onMouseDown}
    >
      <div className="sn-bar" style={{ background: barColor, cursor: 'move' }}>
        <span className="sn-title">{title}</span>
        <button className="sn-close" onClick={() => onDelete(id)} data-btn-id={`BTN-NOTE-CLOSE-${id}`}>✕</button>
      </div>
      <textarea
        style={{ color: '#2a2a2a' }}
        defaultValue={content}
        placeholder="Start typing your note…"
        data-field-id={`FIELD-NOTE-CONTENT-${id}`}
        onFocus={() => onFocus?.(id)}
      />
    </div>
  );
}
