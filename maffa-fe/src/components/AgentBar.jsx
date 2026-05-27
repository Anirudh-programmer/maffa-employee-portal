// components/AgentBar.jsx — live backend health + KPI ticker
import { useLiveStats } from '../hooks/useLiveStats.js';

export default function AgentBar() {
  const { online, lastSync, overview, approvals } = useLiveStats();

  const tasks = (overview?.events?.published || 0) + (overview?.surveys?.total || 0);
  const queries = overview?.queries?.total || 0;
  const pending = approvals?.pending ?? overview?.approvals?.pending ?? 0;

  const syncTxt = online && lastSync
    ? 'Sync ' + lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Offline';

  return (
    <div id="agbar" className={online ? 'online' : 'offline'}>
      <div className="ag-l">maffa.ai</div>
      <div className={'ag-p' + (online ? ' live' : '')} />
      <div className="ag-t">{online ? 'Running' : 'Disconnected'} · {tasks} tasks</div>
      <div className="ag-s" />
      <div className="ag-t">Audit 100%</div>
      <div className="ag-s" />
      <div className="ag-t">{queries} queries</div>
      <div className="ag-s" />
      <div className="ag-t">{pending} approvals pending</div>
      <div className="ag-s" />
      <div className="ag-b"><div className={'ag-bf' + (online ? ' live' : '')} /></div>
      <div className="ag-t" style={online ? {} : { color: '#f87171' }}>{syncTxt}</div>
    </div>
  );
}
