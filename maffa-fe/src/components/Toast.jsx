// components/Toast.jsx
import { useDesktop } from '../context/DesktopContext.jsx';

export default function ToastArea() {
  const { toasts } = useDesktop();
  return (
    <div id="toast-area">
      {toasts.map(t => (
        <div key={t.id} className="toast">
          <div className="t-hd">
            <div className="t-ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.7" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="t-app">Wolf Pack</span>
          </div>
          <div className="t-ttl">{t.title}</div>
          <div className="t-bdy">{t.body}</div>
        </div>
      ))}
    </div>
  );
}
