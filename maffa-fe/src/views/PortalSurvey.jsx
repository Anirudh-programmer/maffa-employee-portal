// views/PortalSurvey.jsx — Active survey runner (5 questions, anonymity-aware)
import { useEffect, useState } from 'react';
import { Badge } from '../components/UI.jsx';
import { useDesktop } from '../context/DesktopContext.jsx';
import { SurveysAPI } from '../services/api.js';

const CURRENT_EMP_ID = 1;  // Aisha Mehta — Employee persona

export default function PortalSurvey() {
  const { toast } = useDesktop();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = () => SurveysAPI.active(CURRENT_EMP_ID)
      .then(d => {
        if (!mounted) return;
        const list = d.items || [];
        const s = list[0] || null;
        // Only swap when the survey identity changes — preserves in-progress answers/step.
        setSurvey(prev => (prev?.survey_id === s?.survey_id ? prev : s));
        if (s?.already_responded) setSubmitted(true);
      })
      .catch(e => mounted && setError(e.message))
      .finally(() => mounted && setLoading(false));
    load();
    const id = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--n4)' }}>Loading active survey…</div>;

  if (!survey) {
    return (
      <>
        <div className="banner">
          <div className="ban-lbl">EMPLOYEE PORTAL</div>
          <div className="ban-title">Active Survey</div>
          <div className="ban-desc">No active survey at the moment. Check back later.</div>
        </div>
      </>
    );
  }

  const questions = survey.questions || [];
  const total = questions.length;
  const q = questions[step];
  const setAnswer = (qid, val) => setAnswers(a => ({ ...a, [qid]: val }));
  const next = () => setStep(s => Math.min(s + 1, total - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    try {
      const payload = Object.entries(answers).map(([qid, val]) => ({
        question_id: parseInt(qid, 10),
        answer_text: String(val),
      }));
      await SurveysAPI.submit(survey.survey_id, CURRENT_EMP_ID, payload);
      setSubmitted(true);
      toast('Submitted', survey.is_anonymous ? 'Anonymous response recorded.' : 'Response recorded.');
    } catch (e) {
      setError(e.message);
      toast('Error', e.message);
    }
  };

  const pct = total > 0 ? Math.round(((step + 1) / total) * 100) : 100;

  return (
    <>
      <div className="banner">
        <div className="ban-lbl">EMPLOYEE PORTAL</div>
        <div className="ban-title">{survey.title}</div>
        <div className="ban-desc">{survey.description || 'Quarterly engagement pulse.'}</div>
        <div className="ban-chips">
          <span className="ban-chip">{survey.is_anonymous ? '🔒 Anonymous' : '👤 Non-anonymous'}</span>
          <span className="ban-chip">{total} Questions</span>
          <span className="ban-chip">Closes {survey.close_date}</span>
        </div>
      </div>

      {submitted && (
        <div className="card mb12">
          <div className="card-bd" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 13, color: 'var(--n1)', fontWeight: 600 }}>Thank you!</div>
            <div style={{ fontSize: 10, color: 'var(--n4)', marginTop: 6 }}>
              Your response has been submitted{survey.is_anonymous ? ' anonymously.' : '.'}
            </div>
          </div>
        </div>
      )}

      {!submitted && q && (
        <div className="card mb12">
          <div className="card-hd">
            <div className="card-title">Q{step + 1} of {total} · {labelFor(q)}</div>
            <Badge cls="bp">{Math.round(pct)}%</Badge>
          </div>
          <div className="card-bd">
            <div style={{ fontSize: 12, color: 'var(--n1)', marginBottom: 12, fontWeight: 500 }}>
              {q.question_text}
            </div>
            <QuestionInput q={q} value={answers[q.question_id]} onChange={v => setAnswer(q.question_id, v)} />
          </div>
          <div className="card-bd" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, borderTop: '1px solid var(--n7)' }}>
            <button className="btn btn-o btn-sm" onClick={prev} disabled={step === 0} data-btn-id="BTN-PREV">← Previous</button>
            {step < total - 1
              ? <button className="btn btn-p btn-sm" onClick={next} data-btn-id="BTN-NEXT">Next →</button>
              : <button className="btn btn-p btn-sm agent-only" onClick={submit} data-btn-id="BTN-SUBMIT-SURVEY">Submit</button>}
          </div>
          {error && <div style={{ padding: '8px 12px', color: 'var(--er)', fontSize: 10 }}>{error}</div>}
        </div>
      )}

      <div className="card">
        <div className="card-hd"><div className="card-title">Survey Info</div></div>
        <div className="card-bd" style={{ fontSize: 10, color: 'var(--n4)', lineHeight: 1.6 }}>
          • Anonymity: <strong>{survey.is_anonymous ? 'Yes (responses are not attributable)' : 'No (your name is attached)'}</strong><br />
          • Open: {survey.open_date} → Close: {survey.close_date}<br />
          • Audience: {survey.audience || survey.target_audience || 'All'}
        </div>
      </div>
    </>
  );
}

function labelFor(q) {
  if (q.question_type === 'rating') return 'Rating Scale';
  if (q.question_type === 'mcq') return 'Multiple Choice';
  return 'Open Text';
}

function QuestionInput({ q, value, onChange }) {
  if (q.question_type === 'rating') {
    const min = q.options?.min || 1;
    const max = q.options?.max || 5;
    const minLabel = q.options?.min_label || 'Poor';
    const maxLabel = q.options?.max_label || 'Excellent';
    const range = [];
    for (let n = min; n <= max; n++) range.push(n);
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--n5)', marginBottom: 6 }}>
          <span>{minLabel}</span><span>{maxLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {range.map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              data-btn-id={`BTN-SURVEY-RATING-${q.question_id}-${n}`}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6,
                border: value === n ? '1px solid var(--p)' : '1px solid var(--n7)',
                background: value === n ? 'var(--p)' : 'var(--n8)',
                color: value === n ? 'white' : 'var(--n2)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >{n}</button>
          ))}
        </div>
      </>
    );
  }
  if (q.question_type === 'mcq') {
    const opts = q.options || [];
    return (
      <div>
        {opts.map((o, i) => (
          <div
            key={i}
            onClick={() => onChange(o)}
            data-btn-id={`BTN-SURVEY-MCQ-${q.question_id}-${i}`}
            style={{
              padding: '8px 12px', marginBottom: 6, borderRadius: 6, cursor: 'pointer',
              border: value === o ? '1px solid var(--p)' : '1px solid var(--n7)',
              background: value === o ? 'rgba(89, 41, 208, .12)' : 'transparent',
              color: 'var(--n1)', fontSize: 11,
            }}
          >{o}</div>
        ))}
      </div>
    );
  }
  // text
  return (
    <textarea
      style={{
        width: '100%', minHeight: 80, padding: 10, fontSize: 11, marginTop: 4,
        border: '1px solid var(--n7)', borderRadius: 6,
        background: 'var(--n8)', color: 'var(--n1)',
      }}
      placeholder={'Type your answer here…'}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      data-field-id={`FIELD-SURVEY-ANSWER-${q.question_id}`}
    />
  );
}
