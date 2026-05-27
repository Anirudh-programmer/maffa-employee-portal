// context/DesktopContext.jsx — Global desktop state
// Manages: open windows, toasts, audit rail, deleted notes, tasks, z-index
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect
} from 'react';
import { INITIAL_TASKS, NOTE_COLORS } from '../data/index.js';
import { TasksAPI } from '../services/api.js';
const DesktopContext = createContext(null);

export function DesktopProvider({ children }) {
  // ── Z-index counter ────────────────────────────────────────
  const zTopRef = useRef(100);
  const nextZ = useCallback(() => ++zTopRef.current, []);

  // ── Z-index tracking for notes and tasks ────────────────────
  const [noteZIndex, setNoteZIndex] = useState({});
  const [taskZIndex, setTaskZIndex] = useState(50);

  const focusNote = useCallback((noteId) => {
    setNoteZIndex(prev => ({ ...prev, [noteId]: nextZ() }));
  }, [nextZ]);

  const focusTask = useCallback(() => {
    setTaskZIndex(nextZ());
  }, [nextZ]);

  // ── Open windows  ──────────────────────────────────────────
  // windows: { [appId]: { minimized, fullscreen, x, y, w, h, zIndex, focused } }
  const [windows, setWindows] = useState({});
  const [focusedId, setFocusedId] = useState(null);

  // ── Active menu bar app title ──────────────────────────────
  const [mbAppTitle, setMbAppTitle] = useState('Maffa');

  // ── Audit rail ─────────────────────────────────────────────
  const [auditOpen, setAuditOpen] = useState(false);

  // ── Toasts ─────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((title, body) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, title, body }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600);
  }, []);

  // ── Tasks ──────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  // ✅ LOAD TASKS FROM BACKEND
  useEffect(() => {
    TasksAPI.list()
      .then(data => {
        // console.log("✅ FROM BACKEND:", data);
        setTasks(data);
      })
      .catch(err => {
        console.error("❌ API failed, using mock", err);
        setTasks(INITIAL_TASKS); // fallback
      });
  }, []);
  const taskSeq = useRef(6);

  const toggleTask = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updated = await TasksAPI.toggle(id, !task.done);
    setTasks(ts => ts.map(t => t.id === id ? updated : t));
  }, [tasks]);
  const removeTask = useCallback(async (id) => {
    await TasksAPI.remove(id);
    setTasks(ts => ts.filter(t => t.id !== id));
  }, []);
  const addTask = useCallback(async (txt) => {
    if (!txt?.trim()) return;

    const created = await TasksAPI.create(txt.trim());
    setTasks(ts => [...ts, created]);
  }, []);

  // ── Notes ──────────────────────────────────────────────────
  const [notes, setNotes] = useState([
    { id: 'sn1', title: 'Agent Notes', content: `Review SLA breach QR-2816\nFollow up: Parental leave policy gap\nDraft: Travel Insurance KB article\nCheck Anniversary Template v4 revision`, color: '#fffbe6', barColor: '#ffd700', x: 10, y: 12 },
  ]);
  const noteSeq = useRef(2);

  const addNote = useCallback(() => {
    const existingCount = notes.length;
    const idx = Math.floor(Math.random() * NOTE_COLORS.length);
    const [color, barColor] = NOTE_COLORS[idx];
    const newNote = {
      id: 'sn-' + Date.now(),
      title: 'New Note',
      content: '',
      color,
      barColor,
      x: 240,
      y: Math.min(12 + existingCount * 180, window.innerHeight - 300),
    };
    setNotes(prev => [...prev, newNote]);
    toast('Note Created', 'New sticky note added to desktop');
  }, [notes.length, toast]);

  const deleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    toast('Note Deleted', 'Note has been permanently removed');
  }, [toast]);

  // Deleted notes (trash) - REMOVED


  // ── Dock reveal in fullscreen mode ────────────────────────
  const [dockRevealed, setDockRevealed] = useState(false);

  // ── Recent apps ────────────────────────────────────────────
  const [recentApps, setRecentApps] = useState([]);
  const pushRecent = useCallback((id, title) => {
    setRecentApps(r => {
      const filtered = r.filter(x => x.id !== id);
      return [{ id, title, t: new Date() }, ...filtered].slice(0, 3);
    });
  }, []);

  // ── Window helpers ─────────────────────────────────────────
  const openWindow = useCallback((id, appConfig, daRef) => {
    const newTopZ = nextZ();
    const fullscreen = appConfig.defaultFullscreen !== false;
    const geom = fullscreen
      ? { x: 0, y: 0, w: '100%', h: '100%' }
      : { x: 80, y: 60, w: appConfig.w || 600, h: appConfig.h || 480 };
    setWindows(prev => {
      const next = {};
      // demote everything else
      for (const k in prev) {
        next[k] = { ...prev[k], focused: false, zIndex: prev[k].zIndex || 100 };
      }
      // promote target — reset geometry per app's defaultFullscreen setting
      const existing = prev[id];
      next[id] = existing
        ? {
            ...existing,
            ...geom,
            _prevX: undefined, _prevY: undefined, _prevW: undefined, _prevH: undefined,
            _maxed: false,
            minimized: false,
            fullscreen,
            focused: true,
            zIndex: newTopZ,
          }
        : {
            ...geom,
            zIndex: newTopZ,
            minimized: false,
            fullscreen,
            focused: true,
          };
      return next;
    });
    setFocusedId(id);
    pushRecent(id, appConfig.title);
    setMbAppTitle(appConfig.title);
  }, [nextZ, pushRecent]);

  const closeWindow = useCallback((id) => {
    setWindows(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (focusedId === id) {
      setFocusedId(null);
      setMbAppTitle('Maffa');
    }
  }, [focusedId]);

  const minimizeWindow = useCallback((id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], minimized: true } }));
  }, []);

  const focusWindow = useCallback((id, title) => {
    const top = nextZ();
    setWindows(prev => {
      const next = {};
      for (const k in prev) next[k] = { ...prev[k], focused: k === id };
      if (next[id]) next[id] = { ...next[id], zIndex: top };
      return next;
    });
    setFocusedId(id);
    if (title) setMbAppTitle(title);
  }, [nextZ]);

  const updateWindowPos = useCallback((id, x, y) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], x, y } }));
  }, []);

  const updateWindowSize = useCallback((id, w, h) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], w, h } }));
  }, []);

  const toggleFullscreen = useCallback((id, appConfig) => {
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      if (win.fullscreen) {
        return {
          ...prev,
          [id]: {
            ...win,
            fullscreen: false,
            x: win._prevX ?? 70,
            y: win._prevY ?? 8,
            w: win._prevW ?? appConfig.w,
            h: win._prevH ?? appConfig.h,
          },
        };
      }
      return {
        ...prev,
        [id]: {
          ...win,
          fullscreen: true,
          _prevX: win.x, _prevY: win.y, _prevW: win.w, _prevH: win.h,
        },
      };
    });
  }, []);

  const maximizeWindow = useCallback((id, daRef) => {
    const da = daRef?.current;
    setWindows(prev => {
      const win = prev[id];
      if (!win) return prev;
      if (win._maxed) {
        return {
          ...prev,
          [id]: { ...win, _maxed: false, x: win._prevX, y: win._prevY, w: win._prevW, h: win._prevH },
        };
      }
      return {
        ...prev,
        [id]: {
          ...win,
          _maxed: true,
          _prevX: win.x, _prevY: win.y, _prevW: win.w, _prevH: win.h,
          x: 62, y: 0,
          w: (da?.offsetWidth || window.innerWidth),
          h: (da?.offsetHeight || window.innerHeight),
        },
      };
    });
  }, []);

  const minimizeAll = useCallback(() => {
    setWindows(prev => {
      const next = {};
      for (const k in prev) next[k] = { ...prev[k], minimized: true };
      return next;
    });
    setFocusedId(null);
    setMbAppTitle('Maffa');
  }, []);

  const restoreAll = useCallback(() => {
    setWindows(prev => {
      const next = {};
      for (const k in prev) next[k] = { ...prev[k], minimized: false };
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setWindows({});
    setFocusedId(null);
    setMbAppTitle('Maffa');
  }, []);

  const isFullscreenActive = Object.values(windows).some(w => w.fullscreen && !w.minimized);

  return (
    <DesktopContext.Provider value={{
      // windows
      windows, openWindow, closeWindow, minimizeWindow, focusWindow,
      updateWindowPos, updateWindowSize, toggleFullscreen, maximizeWindow,
      restoreAll, minimizeAll, closeAll, focusedId, isFullscreenActive,
      // menubar
      mbAppTitle, setMbAppTitle,
      // audit
      auditOpen, setAuditOpen,
      // toasts
      toasts, toast,
      // tasks
      tasks, toggleTask, removeTask, addTask, focusTask, taskZIndex,
      // notes
      notes, addNote, deleteNote, focusNote, noteZIndex,
      // dock & fullscreen
      dockRevealed, setDockRevealed,
      // recent apps
      recentApps,

    }}>
      {children}
    </DesktopContext.Provider>
  );
}

export const useDesktop = () => useContext(DesktopContext);
