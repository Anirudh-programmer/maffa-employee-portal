// views/PortalKB.jsx — HR Help / Knowledge Base chatbot (three-tier confidence)
import { useState } from 'react';
import { Badge } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { KBAPI } from '../services/api.js';

const CURRENT_EMP_ID = 1;

export default function PortalKB() {
  const { toast } = useDesktop();
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const q = query.trim();
    if (!q) return;
    setQuery('');
    setConversation(c => [...c, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await KBAPI.query(CURRENT_EMP_ID, q);
      setConversation(c => [...c, { role: 'bot', payload: res }]);
      if (res.confidence_band === 'low') {
        toast('Routed to HR', `Ticket ${res.ticket_ref} created.`);
      }
    } catch (e) {
      setConversation(c => [...c, { role: 'bot', payload: { error: e.message } }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">EMPLOYEE PORTAL</div>
        <div className="ban-title">HR Help</div>
        <div className="ban-desc">
          Conversational HR knowledge base. Three-tier confidence: ≥0.90 auto-answer · 0.60–0.89 partial match · &lt;0.60 routed to HR.
        </div>
      </div>

      <div className="card mb12" style={{ minHeight: 340 }}>
        <div className="card-hd">
          <div className="card-title">Conversation</div>
          <Badge cls="bgr">Live</Badge>
        </div>
        <div className="card-bd" style={{ minHeight: 280, maxHeight: 420, overflowY: 'auto' }}>
          {conversation.length === 0 && (
            <div style={{ color: 'var(--n4)', fontSize: 11, textAlign: 'center', padding: 32 }}>
              Try asking: "When does the next appraisal cycle begin?" or "Can I work from Thailand?"
            </div>
          )}
          {conversation.map((msg, i) =>
            msg.role === 'user'
              ? (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <div style={{ background: 'var(--p)', color: 'white', padding: '6px 10px', borderRadius: 8, maxWidth: '70%', fontSize: 11 }}>
                    {msg.text}
                  </div>
                </div>
              )
              : <BotMessage key={i} payload={msg.payload} />
          )}
          {loading && <div style={{ color: 'var(--n4)', fontSize: 10, fontStyle: 'italic' }}>Searching…</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-bd" style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            className="fin"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask an HR question…"
            style={{
              flex: 1, padding: '8px 10px', fontSize: 11,
              border: '1px solid var(--n7)', borderRadius: 6,
              background: 'var(--n8)', color: 'var(--n1)',
            }}
            data-field-id="FIELD-KB-QUERY"
          />
          <button className="btn btn-p btn-sm agent-only" onClick={send} disabled={loading} data-btn-id="BTN-KB-SEND">
            {loading ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </>
  );
}

function BotMessage({ payload }) {
  if (payload.error) {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--er)', padding: 10, borderRadius: 8, fontSize: 11, color: 'var(--er)' }}>
          ⚠ {payload.error}
        </div>
      </div>
    );
  }

  const { confidence_band, confidence_score, matched_article, related_articles, ticket_ref, sla_due_at, response_text } = payload;

  if (confidence_band === 'high') {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--ok)', padding: 10, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ok)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              ✓ High Confidence ({Math.round(confidence_score * 100)}%)
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--n1)', lineHeight: 1.5 }}>{matched_article?.content || response_text}</div>
          {matched_article && (
            <div style={{ marginTop: 8, fontSize: 9, color: 'var(--n4)' }}>
              Source: <strong>{matched_article.title}</strong> (Article #{matched_article.article_id})
            </div>
          )}
        </div>
      </div>
    );
  }

  if (confidence_band === 'partial') {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid var(--wn)', padding: 10, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--wn)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              ⚠ Partial Match ({Math.round(confidence_score * 100)}%)
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--n1)', marginBottom: 6 }}>I'm not sure I have the right answer. Here are some related articles:</div>
          <div>
            {(related_articles || []).map(a => (
              <div key={a.article_id} style={{ padding: 6, marginBottom: 4, background: 'rgba(255,255,255,.6)', borderRadius: 4, fontSize: 10 }}>
                <strong>{a.title}</strong>
                <span style={{ float: 'right', color: 'var(--n4)' }}>{Math.round(a.score * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // low
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid var(--er)', padding: 10, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--er)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            🚩 Routed to HR ({Math.round(confidence_score * 100)}%)
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--n1)', lineHeight: 1.5, marginBottom: 6 }}>
          I do not have a confident match. I've routed your query to the HR team.
        </div>
        {ticket_ref && (
          <div style={{ fontSize: 10, color: 'var(--n3)' }}>
            Ticket: <strong>{ticket_ref}</strong> · SLA: 48 hours
          </div>
        )}
      </div>
    </div>
  );
}
