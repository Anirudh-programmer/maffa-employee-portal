// hooks/useLiveStats.js — single shared 10s poll for backend health + KPIs
import { useEffect, useState } from 'react';
import { DashboardAPI, ApprovalsAPI } from '../services/api.js';

export function useLiveStats() {
  const [data, setData] = useState({
    online: false, lastSync: null,
    overview: null, approvals: null,
  });

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      try {
        const [overview, approvals] = await Promise.all([
          DashboardAPI.overview(),
          ApprovalsAPI.stats(),
        ]);
        if (!mounted) return;
        setData({ online: true, lastSync: new Date(), overview, approvals });
      } catch {
        if (mounted) setData(d => ({ ...d, online: false }));
      }
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return data;
}
