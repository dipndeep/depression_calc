import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ─── Data & Konstanta ─────────────────────────────────────────────────────────
const IMPORTANCE = [
  { name: 'Tingkat Kecemasan',  score: 0.1847 },
  { name: 'Tingkat Kecanduan',  score: 0.1203 },
  { name: 'Tingkat Stres',      score: 0.1038 },
  { name: 'Jam Tidur',          score: 0.0987 },
  { name: 'Jam Media Sosial',   score: 0.0876 },
];
const BAR_COLORS = ['#6366f1','#818cf8','#a5b4fc','#06b6d4','#67e8f9'];

const TIPS_HIGH = [
  { icon: '📵', t: 'Batasi Media Sosial',          d: 'Batasi waktu media sosial 1–2 jam/hari. Jadwalkan waktu tanpa ponsel.' },
  { icon: '😴', t: 'Perbaiki Jadwal Tidur',         d: 'Tidur 8–9 jam, hindari layar 1 jam sebelum tidur.' },
  { icon: '🗣️', t: 'Cerita ke Orang Terpercaya',    d: 'Bicarakan perasaan Anda ke teman, keluarga, atau konselor.' },
  { icon: '🏃', t: 'Olahraga Teratur',              d: '20–30 menit olahraga/hari bisa perbaiki mood secara signifikan.' },
  { icon: '🧘', t: 'Kelola Stres',                  d: 'Coba meditasi, pernapasan dalam, atau menulis jurnal.' },
];
const TIPS_LOW = [
  { icon: '🌟', t: 'Pertahankan!',         d: 'Anda sudah menjaga kesehatan mental dengan baik.' },
  { icon: '🤝', t: 'Tetap Terhubung',      d: 'Jaga hubungan sosial — pelindung terbaik kesehatan mental.' },
  { icon: '📚', t: 'Terus Berkembang',     d: 'Hobi baru dan tujuan kecil menjaga semangat hidup.' },
  { icon: '⚖️', t: 'Jaga Keseimbangan',   d: 'Seimbangkan layar, tidur, olahraga, dan sosial.' },
];

const FIELDS = [
  { id: 'age',                      label: 'Usia',                      type: 'number', min: 13, max: 40,  step: 1,    ph: '13–40',    unit: 'Tahun' },
  { id: 'gender',                   label: 'Jenis Kelamin',             type: 'select', opts: [['Male','Laki-laki'],['Female','Perempuan']] },
  { id: 'daily_social_media_hours', label: 'Jam Media Sosial/Hari',     type: 'number', min: 0,  max: 24,  step: 0.5,  ph: '0–24',     unit: 'Jam' },
  { id: 'platform_usage',           label: 'Platform',                  type: 'select', opts: [['Instagram','Instagram'],['TikTok','TikTok'],['Both','Keduanya']] },
  { id: 'sleep_hours',              label: 'Jam Tidur/Malam',           type: 'number', min: 0,  max: 12,  step: 0.5,  ph: '0–12',     unit: 'Jam' },
  { id: 'screen_time_before_sleep', label: 'Layar Sebelum Tidur',       type: 'number', min: 0,  max: 5,   step: 0.25, ph: '0–5',      unit: 'Jam' },
  { id: 'academic_performance',     label: 'IPK / Performa Akademik',   type: 'number', min: 0,  max: 4,   step: 0.1,  ph: '0.0–4.0',  unit: 'IPK' },
  { id: 'physical_activity',        label: 'Aktivitas Fisik/Hari',      type: 'number', min: 0,  max: 10,  step: 0.25, ph: '0–10',     unit: 'Jam' },
  { id: 'social_interaction_level', label: 'Interaksi Sosial',          type: 'select', opts: [['Low','Rendah'],['Medium','Sedang'],['High','Tinggi']] },
  { id: 'stress_level',             label: 'Tingkat Stres',             type: 'slider', min: 1,  max: 10 },
  { id: 'anxiety_level',            label: 'Tingkat Kecemasan',         type: 'slider', min: 1,  max: 10 },
  { id: 'addiction_level',          label: 'Tingkat Kecanduan',         type: 'slider', min: 1,  max: 10 },
];

const INIT = {
  age:'', gender:'Male', daily_social_media_hours:'', platform_usage:'Instagram',
  sleep_hours:'', screen_time_before_sleep:'', academic_performance:'',
  physical_activity:'', social_interaction_level:'Medium',
  stress_level:5, anxiety_level:5, addiction_level:5,
};

// ─── Komponen Lingkaran Progress ──────────────────────────────────────────────
function Ring({ pct, high, dark }) {
  const r = 56, c = 2 * Math.PI * r;
  const color = high ? '#ef4444' : '#22c55e';
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
      <circle cx="70" cy="70" r={r} fill="none" stroke={dark ? '#334155' : '#e5e7eb'} strokeWidth="8"/>
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct/100)*c}
        style={{ transition:'stroke-dashoffset 1s ease', transform:'rotate(-90deg)', transformOrigin:'70px 70px' }}/>
      <text x="70" y="66" textAnchor="middle" fill={color} fontSize="22" fontWeight="700">{pct.toFixed(1)}%</text>
      <text x="70" y="86" textAnchor="middle" fill={dark?'#94a3b8':'#9ca3af'} fontSize="10">Skor Risiko</text>
    </svg>
  );
}

// ─── Komponen NumberStepper ───────────────────────────────────────────────────
function NumberStepper({ id, value, min, max, step, placeholder, unit, dark, onChange }) {
  const val = value === '' ? '' : Number(value);
  const atMin = val === '' || val <= min;
  const atMax = val === '' || val >= max;
  const dec = () => { if (!atMin) onChange(Math.max(min, +(val - step).toFixed(2)).toString()); };
  const inc = () => { if (!atMax) onChange(Math.min(max, +(val + step).toFixed(2)).toString()); };

  const border = dark ? 'border-gray-700' : 'border-gray-300';
  const btnBase = `w-10 flex items-center justify-center transition-colors shrink-0`;
  const btnActive = dark
    ? 'text-indigo-300 hover:bg-indigo-500/15 active:bg-indigo-500/25'
    : 'text-indigo-500 hover:bg-indigo-50 active:bg-indigo-100';
  const btnDisabled = dark ? 'text-gray-700' : 'text-gray-300';

  return (
    <div>
      <div className={`flex items-stretch h-9 rounded-lg border overflow-hidden ${border} ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Tombol minus */}
        <button type="button" onClick={dec} tabIndex={-1}
          className={`${btnBase} border-r ${border} ${atMin ? btnDisabled + ' cursor-not-allowed' : btnActive}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>
        </button>

        {/* Input */}
        <input id={id} type="number" min={min} max={max} step={step} placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`flex-1 min-w-0 text-center text-sm font-medium outline-none bg-transparent ${
            dark ? 'text-gray-100 placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'
          } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          required
        />

        {/* Tombol plus */}
        <button type="button" onClick={inc} tabIndex={-1}
          className={`${btnBase} border-l ${border} ${atMax ? btnDisabled + ' cursor-not-allowed' : btnActive}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <span className={`text-[10px] mt-0.5 block ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{unit}</span>
    </div>
  );
}

// ─── Komponen PillSelect ──────────────────────────────────────────────────────
function PillSelect({ id, options, value, dark, onChange }) {
  return (
    <div id={id} className={`flex rounded-lg border overflow-hidden ${
      dark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-100'
    }`}>
      {options.map(([val, text]) => {
        const active = value === val;
        return (
          <button key={val} type="button" onClick={() => onChange(val)}
            className={`flex-1 py-2 px-2 text-xs font-semibold transition-all duration-200 ${
              active
                ? 'bg-indigo-500 text-white shadow-sm'
                : dark
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

// ─── Aplikasi Utama ───────────────────────────────────────────────────────────
export default function App() {
  const [form, setForm] = useState(INIT);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const ref = useRef(null);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Progress
  const progress = Math.round(
    (FIELDS.filter(f => f.type==='slider' || f.type==='select' || (form[f.id]!==''&&form[f.id]!=null)).length / FIELDS.length) * 100
  );

  const valid = () => FIELDS.every(f => {
    if (f.type !== 'number') return true;
    const v = Number(form[f.id]);
    return form[f.id] !== '' && !isNaN(v) && v >= f.min && v <= f.max;
  });

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!valid()) { setErr('Mohon isi semua kolom dengan nilai yang valid.'); return; }
    setLoading(true);
    try {
      const body = { ...form };
      FIELDS.forEach(f => { if (f.type==='number'||f.type==='slider') body[f.id]=Number(body[f.id]); });
      const { data } = await axios.post('/api/predict', body);
      setRes(data);
      setTimeout(() => ref.current?.scrollIntoView({ behavior:'smooth' }), 100);
    } catch (e) {
      setErr(e.response?.data?.error || 'Gagal terhubung ke server.');
    } finally { setLoading(false); }
  };

  const reset = () => { setForm(INIT); setRes(null); setErr(null); window.scrollTo({top:0,behavior:'smooth'}); };

  const high = res?.prediction === 1;
  const pct = res ? res.probability * 100 : 0;

  // ─── Shared Tailwind class strings ──────────────────────────────────────────
  const bg = dark ? 'bg-gray-950' : 'bg-gray-50';
  const card = `rounded-xl border ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm`;
  const labelCls = `block text-xs font-semibold mb-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`;
  const mutedCls = dark ? 'text-gray-500' : 'text-gray-400';
  const textCls = dark ? 'text-gray-100' : 'text-gray-900';
  const subCls = dark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-xl font-bold ${textCls}`}>🧠 Kalkulator Risiko Depresi</h1>
            <p className={`text-xs mt-0.5 ${subCls}`}>Skrining berbasis model XGBoost machine learning</p>
          </div>
          <button onClick={() => setDark(d=>!d)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition ${
              dark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'
            }`}
            title={dark ? 'Mode Terang' : 'Mode Gelap'}>
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Peringatan */}
        <div className={`rounded-lg border px-4 py-3 mb-5 text-xs leading-relaxed ${
          dark ? 'bg-yellow-500/10 border-yellow-600/30 text-yellow-300' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <strong>⚠️ Perhatian:</strong> Alat ini hanya untuk skrining awal dan <strong>bukan pengganti diagnosis profesional</strong>. Konsultasikan ke psikolog untuk hasil akurat.
        </div>

        {/* ── FORM ── */}
        {!res && (
          <div className={`${card} p-5`}>
            {/* Progress */}
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={subCls}>Kelengkapan</span>
              <span className="font-bold text-indigo-500">{progress}%</span>
            </div>
            <div className={`h-1 rounded-full mb-5 ${dark ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}/>
            </div>

            <form onSubmit={submit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {FIELDS.map(f => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className={labelCls}>{f.label}</label>

                    {f.type === 'select' && (
                      <PillSelect id={f.id} options={f.opts} value={form[f.id]} dark={dark}
                        onChange={v => setForm(p=>({...p,[f.id]:v}))}/>
                    )}

                    {f.type === 'number' && (
                      <NumberStepper id={f.id} value={form[f.id]} min={f.min} max={f.max}
                        step={f.step} placeholder={f.ph} unit={f.unit} dark={dark}
                        onChange={v => setForm(p=>({...p,[f.id]:v}))}/>
                    )}

                    {f.type === 'slider' && (
                      <div>
                        <div className="flex items-center gap-2">
                          <input id={f.id} type="range" min={f.min} max={f.max} step={1}
                            className={`flex-1 ${dark ? 'bg-gray-700' : 'bg-gray-200'}`}
                            value={form[f.id]} onChange={e => setForm(p=>({...p,[f.id]:e.target.value}))}/>
                          <span className="text-xs font-bold text-white bg-indigo-500 rounded px-2 py-0.5 min-w-[28px] text-center">
                            {form[f.id]}
                          </span>
                        </div>
                        <div className={`flex justify-between text-[10px] ${mutedCls}`}>
                          <span>Rendah</span><span>Tinggi</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {err && (
                <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  ❌ {err}
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button type="submit" disabled={loading || progress < 30}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition">
                  {loading ? <span className="flex items-center gap-2"><span className="spinner"/>Menganalisis…</span> : '🔍 Analisis Risiko'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── HASIL ── */}
        {res && (
          <div ref={ref} className="space-y-4">

            {/* Risiko */}
            <div className={`${card} p-6 text-center`}>
              <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
                high
                  ? (dark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200')
                  : (dark ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-50 text-green-600 border border-green-200')
              }`}>
                {high ? '🔴 Risiko Tinggi' : '🟢 Risiko Rendah'}
              </span>
              <h2 className={`text-lg font-bold mt-3 ${high ? (dark?'text-red-400':'text-red-600') : (dark?'text-green-400':'text-green-600')}`}>
                {high ? 'Terdeteksi Tanda Risiko Depresi' : 'Risiko Depresi Rendah'}
              </h2>
              <p className={`text-xs mt-1 mb-4 ${subCls}`}>
                {high ? 'Beberapa faktor risiko teridentifikasi. Lihat rekomendasi di bawah.' : 'Kondisi mental Anda terlihat baik. Pertahankan!'}
              </p>
              <Ring pct={pct} high={high} dark={dark}/>
              <p className={`text-[11px] mt-2 ${mutedCls}`}>
                Kepercayaan model: <strong className="text-indigo-500">{(Math.max(res.probability, 1-res.probability)*100).toFixed(1)}%</strong>
              </p>
            </div>

            {/* Grafik */}
            <div className={`${card} p-5`}>
              <h3 className={`text-sm font-bold ${textCls}`}>📊 Faktor Paling Berpengaruh</h3>
              <p className={`text-[11px] mb-3 ${mutedCls}`}>5 fitur terpenting dalam prediksi model</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={IMPORTANCE.map(f=>({name:f.name,value:f.score}))} layout="vertical" margin={{left:0,right:16,top:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark?'#1e293b':'#f1f5f9'} horizontal={false}/>
                  <XAxis type="number" domain={[0,0.22]} tickFormatter={v=>`${(v*100).toFixed(0)}%`} tick={{fontSize:9,fill:dark?'#64748b':'#9ca3af'}}/>
                  <YAxis type="category" dataKey="name" width={130} tick={{fontSize:10,fill:dark?'#cbd5e1':'#4b5563'}}/>
                  <Tooltip content={({active,payload})=>active&&payload?.length?
                    <div className={`text-xs font-bold px-2 py-1 rounded ${dark?'bg-gray-800 text-indigo-300':'bg-white text-indigo-600 shadow border border-gray-100'}`}>
                      {(payload[0].value*100).toFixed(1)}%
                    </div>:null}/>
                  <Bar dataKey="value" radius={[0,4,4,0]} maxBarSize={16}>
                    {IMPORTANCE.map((_,i)=><Cell key={i} fill={BAR_COLORS[i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rekomendasi */}
            <div className={`${card} p-5`}>
              <h3 className={`text-sm font-bold ${textCls}`}>
                {high ? '💡 Rekomendasi' : '🌈 Tips Kesehatan Mental'}
              </h3>
              <p className={`text-[11px] mb-3 ${mutedCls}`}>
                {high ? 'Langkah yang bisa Anda ambil:' : 'Pertahankan kebiasaan baik Anda:'}
              </p>
              <div className="space-y-2">
                {(high ? TIPS_HIGH : TIPS_LOW).map((r,i) => (
                  <div key={i} className={`flex gap-3 p-3 rounded-lg border ${
                    dark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <span className="text-lg">{r.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${textCls}`}>{r.t}</p>
                      <p className={`text-xs ${subCls} leading-relaxed`}>{r.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peringatan bawah */}
            <div className={`rounded-lg border px-4 py-3 text-xs leading-relaxed ${
              dark ? 'bg-yellow-500/10 border-yellow-600/30 text-yellow-300' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <strong>⚠️ Perhatian:</strong> Alat ini bukan pengganti diagnosis profesional. Konsultasikan ke psikolog untuk hasil akurat.
            </div>

            {/* Reset */}
            <div className="flex justify-center">
              <button onClick={reset}
                className={`text-sm font-semibold px-5 py-2 rounded-lg border transition ${
                  dark ? 'border-gray-700 text-indigo-400 hover:bg-gray-800' : 'border-gray-300 text-indigo-600 hover:bg-gray-50'
                }`}>
                ↺ Isi Ulang Penilaian
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className={`text-center text-[11px] mt-6 ${mutedCls}`}>
          Kalkulator Risiko Depresi · Dibuat oleh Ganendra · Hanya untuk keperluan edukasi
        </p>
      </div>
    </div>
  );
}
