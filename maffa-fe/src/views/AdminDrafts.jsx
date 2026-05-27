// views/AdminDrafts.jsx — Draft & returned items per spec section "Draft Items"
import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Badge } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { DraftsAPI, RecognitionAPI } from '../services/api.js';

const CURRENT_USER_ID = 2;  // Yogesh (HR Coordinator)

export default function AdminDrafts() {
  const { toast } = useDesktop();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    DraftsAPI.list(CURRENT_USER_ID)
      .then(d => setItems(d.items || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    reload();
    const id = setInterval(reload, 10000);
    return () => clearInterval(id);
  }, []);

  const resubmit = async (item) => {
    try {
      if (item.content_type === 'template') {
        await RecognitionAPI.resubmit(item.content_id);
        toast('Resubmitted', `${item.title} sent for approval.`);
        reload();
      } else {
        toast('Resubmit', `Open the ${item.content_type} builder to update and submit ${item.title}.`);
      }
    } catch (e) {
      toast('Error', e.message);
    }
  };

  const drafts = items.filter(i => i.status === 'draft');
  const pending = items.filter(i => i.status === 'pending_approval');
  const rejected = items.filter(i => i.status === 'rejected');

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">HR COORDINATOR</div>
        <div className="ban-title">Draft Items</div>
        <div className="ban-desc">Unapproved or incomplete content. Edit, resubmit, or discard.</div>
        <div className="ban-chips">
          <span className="ban-chip">{drafts.length} Drafts</span>
          <span className="ban-chip">{pending.length} Awaiting Approval</span>
          <span className="ban-chip">{rejected.length} Returned</span>
        </div>
      </div>

      {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--n4)' }}>Loading…</div>}

      {!loading && items.length === 0 && (
        <div className="card">
          <div className="card-bd" style={{ textAlign: 'center', padding: 32, color: 'var(--n4)' }}>
            No drafts. Create a survey, event or template and click Save Draft to see it here.
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Title</th><th>Type</th><th>Status</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => {
                const cls =
                  i.status === 'draft'             ? 'bgr' :
                  i.status === 'pending_approval'  ? 'bcy' :
                  i.status === 'rejected'          ? 'ber' : 'bp';
                return (
                  <tr key={`${i.content_type}-${i.content_id}`}>
                    <td><strong>{i.title}</strong></td>
                    <td><Badge cls="bp">{i.content_type}</Badge></td>
                    <td><Badge cls={cls}>{i.status.replace('_', ' ')}</Badge></td>
                    <td>{(i.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                    <td style={{ textAlign: 'right' }}>
                      {(i.status === 'draft' || i.status === 'rejected') && (
                        <button className="btn btn-p btn-sm agent-only" onClick={() => resubmit(i)} data-btn-id={`BTN-DRAFTS-RESUBMIT-${i.content_type}-${i.content_id}`}>
                          <Send size={11} style={{ marginRight: 4 }} />Resubmit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
