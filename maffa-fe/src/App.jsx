// App.jsx — Root application component
import { useRef, useCallback } from 'react';
import { useDesktop } from './context/DesktopContext.jsx';
import { APPS } from './data/index.js';

import MenuBar      from './components/MenuBar.jsx';
import LeftStrip    from './components/LeftStrip.jsx';
import AuditRail    from './components/AuditRail.jsx';
import AgentBar     from './components/AgentBar.jsx';
import Dock         from './components/Dock.jsx';
import Window       from './components/Window.jsx';
import Toast        from './components/Toast.jsx';
import StickyNote   from './components/StickyNote.jsx';
import TaskWidget   from './components/TaskWidget.jsx';

export default function App() {
  const daRef = useRef(null);
  const {
    windows, openWindow, notes, addNote, deleteNote, toast, isFullscreenActive,
    focusNote, noteZIndex, focusTask, taskZIndex, dockRevealed, setDockRevealed,
  } = useDesktop();

  const handleOpenApp = useCallback((id) => {
    const cfg = APPS[id];
    if (!cfg) return;
    openWindow(id, cfg, daRef);
  }, [openWindow]);

  const handleNewNote = useCallback(() => {
    addNote();
  }, [addNote]);

  const handleDeleteNote = useCallback((id) => {
    deleteNote(id);
  }, [deleteNote]);

  // ── Handle mousemove for dock reveal in fullscreen ──────────────
  const handleMouseMove = useCallback((e) => {
    if (!isFullscreenActive) return;
    const bottomThreshold = window.innerHeight - 120;
    const nearBottom = e.clientY > bottomThreshold;
    setDockRevealed(nearBottom);
  }, [isFullscreenActive, setDockRevealed]);

  return (
    <div
      id="desktop"
      className={`${isFullscreenActive ? 'fullscreen-mode' : ''}${isFullscreenActive && dockRevealed ? ' dock-reveal' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* ── Menu bar ── */}
      <MenuBar />

      {/* ── Workspace ── */}
      <div id="ws">
        {/* Left icon strip */}
        <LeftStrip onOpenApp={handleOpenApp} onNewNote={handleNewNote} />

        {/* Desktop area */}
        <div id="da" ref={daRef}>
          {/* Sticky notes (pinned, non-draggable) */}
          {notes.map(n => (
            <StickyNote
              key={n.id}
              id={n.id}
              title={n.title}
              content={n.content}
              color={n.color}
              barColor={n.barColor}
              initialX={n.x}
              initialY={n.y}
              onDelete={handleDeleteNote}
              zIndex={noteZIndex[n.id] || 50}
              onFocus={focusNote}
            />
          ))}

          {/* Task widget (pinned, non-draggable) */}
          <TaskWidget onFocus={focusTask} zIndex={taskZIndex} />

          {/* Open windows */}
          {Object.keys(windows).map(appId => (
            <Window key={appId} appId={appId} />
          ))}

          {/* Toast notifications */}
          <Toast />
        </div>

        {/* Audit rail */}
        <AuditRail />
      </div>

      {/* ── Agent status bar ── */}
      <AgentBar />

      {/* ── Dock ── */}
      <Dock onOpen={handleOpenApp} />
    </div>
  );
}
