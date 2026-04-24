import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────
const FEATURE_IMPORTANCE = [
  { name: 'Anxiety Level',          key: 'anxiety_level',            score: 0.1847 },
  { name: 'Addiction Level',         key: 'addiction_level',           score: 0.1203 },
  { name: 'Stress Level',            key: 'stress_level',              score: 0.1038 },
  { name: 'Sleep Hours',             key: 'sleep_hours',               score: 0.0987 },
  { name: 'Daily Social Media Hrs',  key: 'daily_social_media_hours',  score: 0.0876 },
];

const HIGH_RISK_RECS = [
  { icon: '📵', title: 'Limit Social Media Usage',   text: 'Try to cap your daily social media time to 1–2 hours. Use app timers and schedule phone-free periods.' },
  { icon: '😴', title: 'Improve Your Sleep Schedule', text: 'Aim for 8–9 hours of sleep. Avoid screens for at least 1 hour before bed and keep a consistent bedtime.' },
  { icon: '🗣️', title: 'Talk to Someone You Trust',  text: 'Reach out to a trusted friend, family member, or counselor. You don\'t have to face these feelings alone.' },
  { icon: '🏃', title: 'Exercise Regularly',          text: 'Even 20–30 minutes of physical activity daily can significantly improve mood and reduce anxiety.' },
  { icon: '🧘', title: 'Practice Stress Management',  text: 'Try mindfulness, deep breathing, journaling, or meditation. Apps like Headspace can help you get started.' },
];

const LOW_RISK_RECS = [
  { icon: '🌟', title: 'Keep Up the Great Work!',    text: 'You\'re maintaining healthy habits. Continue prioritizing your mental and physical well-being.' },
  { icon: '🤝', title: 'Stay Connected',              text: 'Nurture your relationships. Strong social bonds are one of the best protectors of mental health.' },
  { icon: '📚', title: 'Keep Learning & Growing',    text: 'Pursue hobbies, learn new skills, and set achievable goals to maintain a sense of purpose.' },
  { icon: '⚖️', title: 'Maintain Balance',            text: 'Continue balancing screen time, sleep, physical activity, and social interactions for sustained wellness.' },
];

const FORM_FIELDS = [
  { id: 'age',                       label: 'Age',                      icon: '🎂', type: 'number', min: 13, max: 19, step: 1,   placeholder: '13–19',   hint: 'Years' },
  { id: 'gender',                    label: 'Gender',                   icon: '⚧️', type: 'select', options: ['Male','Female'] },
  { id: 'daily_social_media_hours',  label: 'Daily Social Media Hours', icon: '📱', type: 'number', min: 0,  max: 24, step: 0.5,  placeholder: '0–24',    hint: 'Hours/day' },
  { id: 'platform_usage',            label: 'Platform Usage',           icon: '💬', type: 'select', options: ['Instagram','TikTok','Both'] },
  { id: 'sleep_hours',               label: 'Sleep Hours',              icon: '😴', type: 'number', min: 0,  max: 12, step: 0.5,  placeholder: '0–12',    hint: 'Hours/night' },
  { id: 'screen_time_before_sleep',  label: 'Screen Time Before Sleep', icon: '🌙', type: 'number', min: 0,  max: 5,  step: 0.25, placeholder: '0–5',     hint: 'Hours before bed' },
  { id: 'academic_performance',      label: 'Academic Performance',     icon: '📚', type: 'number', min: 0,  max: 4,  step: 0.1,  placeholder: '0.0–4.0', hint: 'GPA scale' },
  { id: 'physical_activity',         label: 'Physical Activity',        icon: '🏃', type: 'number', min: 0,  max: 10, step: 0.25, placeholder: '0–10',    hint: 'Hours/day' },
  { id: 'social_interaction_level',  label: 'Social Interaction Level', icon: '🤝', type: 'select', options: ['Low','Medium','High'] },
  { id: 'stress_level',              label: 'Stress Level',             icon: '😰', type: 'slider', min: 1,  max: 10 },
  { id: 'anxiety_level',             label: 'Anxiety Level',            icon: '😟', type: 'slider', min: 1,  max: 10 },
  { id: 'addiction_level',           label: 'Addiction Level',          icon: '🔗', type: 'slider', min: 1,  max: 10 },
];

const DEFAULTS = {
  age: '', gender: 'Male',
  daily_social_media_hours: '', platform_usage: 'Instagram',
  sleep_hours: '', screen_time_before_sleep: '', academic_performance: '',
  physical_activity: '', social_interaction_level: 'Medium',
  stress_level: 5, anxiety_level: 5, addiction_level: 5,
};

// ─── Circular Progress ────────────────────────────────────────────────────────
function CircularProgress({ probability, isHigh }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pct    = probability * 100;
  const offset = circumference - (pct / 100) * circumference;
  const color  = isHigh
    ? 'url(#gradRed)'
    : 'url(#gradGreen)';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444"/>
            <stop offset="100%" stopColor="#f97316"/>
          </linearGradient>
          <linearGradient id="gradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#e0e7ff" strokeWidth="10"/>
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)', transform: 'rotate(-90deg)', transformOrigin: '90px 90px' }}
        />
        <text x="90" y="86" textAnchor="middle" fill={isHigh ? '#ef4444' : '#10b981'} fontSize="28" fontWeight="800" fontFamily="Outfit,sans-serif">
          {pct.toFixed(1)}%
        </text>
        <text x="90" y="108" textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="Inter,sans-serif">
          Risk Score
        </text>
      </svg>
    </div>
  );
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm font-semibold" style={{ borderRadius: 10 }}>
      <span style={{ color: '#6366f1' }}>{(payload[0].value * 100).toFixed(1)}%</span>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [formData, setFormData]   = useState(DEFAULTS);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [progress, setProgress]   = useState(0);
  const resultRef = useRef(null);

  // ── Completion percentage ──────────────────────────────────────────────────
  useEffect(() => {
    const filled = FORM_FIELDS.filter(f => {
      const v = formData[f.id];
      if (f.type === 'slider') return true;
      if (f.type === 'select') return true;
      return v !== '' && v !== null && v !== undefined;
    }).length;
    setProgress(Math.round((filled / FORM_FIELDS.length) * 100));
  }, [formData]);

  const handleChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const validate = () => {
    for (const f of FORM_FIELDS) {
      const v = formData[f.id];
      if (f.type === 'number') {
        if (v === '' || v === null || isNaN(Number(v))) return false;
        if (Number(v) < f.min || Number(v) > f.max) return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) {
      setError('Please fill in all fields with valid values within the allowed ranges.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...formData };
      FORM_FIELDS.forEach(f => {
        if (f.type === 'number' || f.type === 'slider') {
          payload[f.id] = Number(payload[f.id]);
        }
      });
      const { data } = await axios.post('/api/predict', payload);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULTS);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHigh = result?.prediction === 1;
  const chartData = FEATURE_IMPORTANCE.map(f => ({ name: f.name, value: f.score }));

  return (
    <div className="hero-bg min-h-screen py-8 px-4">
      {/* ── Floating blobs ── */}
      <div style={{ position: 'fixed', top: '-120px', right: '-80px', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>
      <div style={{ position: 'fixed', bottom: '-100px', left: '-60px', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }}/>

      <div className="max-w-3xl mx-auto relative" style={{ zIndex: 1 }}>

        {/* ── Header ── */}
        <header className="text-center mb-8 fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mental Health Screening</span>
          </div>
          <h1 className="gradient-text mb-3" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15 }}>
            Teen Depression<br/>Risk Calculator
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem', maxWidth: 480, margin: '0 auto', lineHeight: 1.65 }}>
            A science-backed screening tool powered by an XGBoost machine learning model trained on teen mental health data.
          </p>
        </header>

        {/* ── Warning Banner ── */}
        <div className="warning-banner mb-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: 1.6 }}>
            <strong>⚠️ Disclaimer:</strong> This tool is for <strong>screening purposes only</strong> and does not replace professional diagnosis. For accurate results, please consult a licensed psychologist or mental health professional.
          </p>
        </div>

        {/* ── Form Card ── */}
        {!result && (
          <div className="glass-card p-6 md:p-8 fade-in-up" style={{ animationDelay: '0.15s' }}>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>Form Completion</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1' }}>{progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }}/>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {FORM_FIELDS.map((field, idx) => (
                  <div key={field.id} className="fade-in-up" style={{ animationDelay: `${0.05 * idx}s` }}>
                    <label htmlFor={field.id} style={{ display: 'block', marginBottom: '0.3rem' }}>
                      <span className="input-icon">{field.icon} {field.label}</span>
                    </label>

                    {field.type === 'select' && (
                      <select
                        id={field.id}
                        className="custom-select"
                        value={formData[field.id]}
                        onChange={e => handleChange(field.id, e.target.value)}
                      >
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}

                    {field.type === 'number' && (
                      <>
                        <input
                          id={field.id}
                          type="number"
                          className="custom-input"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          placeholder={`${field.placeholder}`}
                          value={formData[field.id]}
                          onChange={e => handleChange(field.id, e.target.value)}
                          required
                        />
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.2rem', display: 'block' }}>{field.hint}</span>
                      </>
                    )}

                    {field.type === 'slider' && (
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            id={field.id}
                            type="range"
                            className="custom-slider"
                            min={field.min}
                            max={field.max}
                            step={1}
                            value={formData[field.id]}
                            onChange={e => handleChange(field.id, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <span className="slider-value">{formData[field.id]}</span>
                        </div>
                        <div className="flex justify-between" style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                          <span>Low ({field.min})</span>
                          <span>High ({field.max})</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-5 px-4 py-3 rounded-xl" style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.875rem' }}>
                  ❌ {error}
                </div>
              )}

              {/* Submit */}
              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  id="submit-btn"
                  className="btn-primary pulse-glow"
                  style={{ minWidth: 220 }}
                  disabled={loading || progress < 30}
                >
                  {loading ? (
                    <span className="flex items-center gap-3 justify-center">
                      <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}/>
                      Analyzing…
                    </span>
                  ) : '🔍 Analyze Risk'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Result Card ── */}
        {result && (
          <div ref={resultRef} className="fade-in-up" style={{ animationDelay: '0.05s' }}>

            {/* Risk Header */}
            <div className="glass-card p-6 md:p-8 mb-5 text-center">
              <div className="mb-2">
                <span
                  className={`inline-block px-5 py-2 rounded-full font-bold text-lg ${isHigh ? 'risk-badge-high' : 'risk-badge-low'}`}
                  style={{ fontFamily: 'Outfit,sans-serif' }}
                >
                  {isHigh ? '🔴 High Risk' : '🟢 Low Risk'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: isHigh ? '#991b1b' : '#065f46', margin: '0.5rem 0' }}>
                {isHigh ? 'Signs of Depression Risk Detected' : 'Low Depression Risk Detected'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {isHigh
                  ? 'Based on your responses, several risk factors were identified. Please consider the recommendations below.'
                  : 'Your responses suggest a healthy mental state. Keep up the great habits!'}
              </p>

              {/* Circular progress */}
              <CircularProgress probability={result.probability} isHigh={isHigh}/>

              <p style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                Model confidence: <strong style={{ color: '#6366f1' }}>{(Math.max(result.probability, 1 - result.probability) * 100).toFixed(1)}%</strong>
              </p>
            </div>

            {/* Feature Importance Chart */}
            <div className="glass-card p-6 md:p-8 mb-5">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', color: '#1e1b4b' }}>
                📊 Top Influencing Factors
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                The 5 most important features contributing to the model's prediction.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" horizontal={false}/>
                  <XAxis type="number" domain={[0, 0.22]} tickFormatter={v => `${(v*100).toFixed(0)}%`} tick={{ fontSize: 11, fill: '#6b7280' }}/>
                  <YAxis type="category" dataKey="name" width={168} tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {chartData.map((_, i) => {
                      const colors = ['#6366f1','#8b5cf6','#a78bfa','#06b6d4','#0ea5e9'];
                      return <Cell key={i} fill={colors[i]}/>;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendations */}
            <div className="glass-card p-6 md:p-8 mb-5">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', color: '#1e1b4b' }}>
                {isHigh ? '💡 Actionable Recommendations' : '🌈 Tips to Maintain Wellness'}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                {isHigh
                  ? 'Here are personalized steps to help address your risk factors.'
                  : 'You\'re doing well! Here\'s how to keep it up.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(isHigh ? HIGH_RISK_RECS : LOW_RISK_RECS).map((rec, i) => (
                  <div key={i} className="rec-card fade-in-up" style={{ animationDelay: `${0.08 * i}s` }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>{rec.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: '#1e1b4b' }}>{rec.title}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6 }}>{rec.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning banner again */}
            <div className="warning-banner mb-6">
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6 }}>
                <strong>⚠️ Disclaimer:</strong> This tool is for <strong>screening purposes only</strong> and does not replace professional diagnosis. For accurate results, please consult a licensed psychologist or mental health professional.
              </p>
            </div>

            {/* Reset button */}
            <div className="flex justify-center mb-6">
              <button id="reset-btn" className="btn-secondary" onClick={handleReset}>
                ↺ Take the Assessment Again
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-4 mb-2" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
          Teen Depression Risk Calculator · Powered by XGBoost · For educational use only
        </footer>
      </div>
    </div>
  );
}
