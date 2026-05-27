// hooks/useDrag.js — Reusable mouse-drag hook
// Used by: Window, StickyNote, TaskWidget, ActivityWidget
import { useRef, useCallback } from 'react';

/**
 * @param {React.RefObject} elRef  - the element being moved
 * @param {(x,y)=>void} onMove     - called with new left/top px values
 * @param {()=>void}    onStart    - optional: called when drag begins (e.g. bring to front)
 * @param {()=>boolean} canDrag    - optional guard (e.g. don't drag when fullscreen)
 */
export function useDrag(elRef, onMove, onStart, canDrag) {
  const state = useRef({ on: false, sx: 0, sy: 0, sl: 0, st: 0 });

  const handleMouseDown = useCallback((e) => {
    if (canDrag && !canDrag()) return;
    const el = elRef.current;
    if (!el) return;
    state.current = {
      on: true,
      sx: e.clientX,
      sy: e.clientY,
      sl: el.offsetLeft,
      st: el.offsetTop,
    };
    onStart?.();
    e.preventDefault();

    const onMove_ = (e) => {
      if (!state.current.on) return;
      const { sx, sy, sl, st } = state.current;
      onMove(sl + e.clientX - sx, st + e.clientY - sy);
    };
    const onUp = () => {
      state.current.on = false;
      document.removeEventListener('mousemove', onMove_);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove_);
    document.addEventListener('mouseup', onUp);
  }, [elRef, onMove, onStart, canDrag]);

  return { handleMouseDown };
}
