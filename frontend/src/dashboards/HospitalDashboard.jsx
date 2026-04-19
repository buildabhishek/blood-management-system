import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/api';
import RCSidebar from '../components/RCSidebar';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC } from '../components/RCTheme';

const BLOOD_GROUPS   = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const DELIVERY_STEPS = ['ASSIGNED','IN_TRANSIT','DELIVERED'];

const TABS = [
  { key:'search',   icon:'🔍', label:'Find Blood'   },
  { key:'request',  icon:'🩸', label:'New Request'  },
  { key:'tracking', icon:'📡', label:'Live Tracking'},
  { key:'history',  icon:'📊', label:'History'      },
];

// ── Header bar ───────────────────────────────────────────────────────────────
function PageHeader({ title }) {
  return (
    <div className="flex items-center px-8 py-4"
      style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}>
      <div>
        <h2 className="font-black text-lg" style={{ color: RC.crimson }}>{title}</h2>
        <p className="text-xs" style={{ color: RC.textMuted }}>
          RC Foundation — Blood Management System
        </p>
      </div>
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, variant }) {
  const variants = {
    crimson: { bg: RC.pinkBg, border: RC.crimsonLight, val: RC.crimson },
    green:   { bg: RC.greenLight, border: RC.greenMid, val: RC.greenDark },
    blue:    { bg: RC.cardBlue, border: '#90CAF9', val: '#1565C0' },
  };
  const v = variants[variant] || variants.crimson;
  return (
    <div className="rounded-xl p-4 text-center"
      style={{ backgroundColor: v.bg, border: `1.5px solid ${v.border}` }}>
      <div className="text-2xl font-black" style={{ color: v.val }}>{value}</div>
      <div className="text-xs mt-0.5 font-medium" style={{ color: RC.textMid }}>{label}</div>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ status }) {
  const idx = DELIVERY_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {DELIVERY_STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full transition-all"
            style={{ backgroundColor: i <= idx ? RC.crimson : '#E0E0E0' }} />
          {i < DELIVERY_STEPS.length - 1 && (
            <div className="h-0.5 w-8 transition-all"
              style={{ backgroundColor: i < idx ? RC.crimson : '#E0E0E0' }} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs font-semibold" style={{ color: RC.textMid }}>
        {status.replace('_',' ')}
      </span>
    </div>
  );
}

// ── Search ───────────────────────────────────────────────────────────────────
function SearchSection({ onSelectBank }) {
  const [bloodGroup, setBG]   = useState('');
  const [quantity, setQty]    = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useLocation, setUL]  = useState(false);
  const [coords, setCoords]   = useState(null);
  const [searched, setSearched] = useState(false);

  const getLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      p => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setUL(true); },
      ()  => setUL(false)
    );
  };

  const search = async () => {
    if (!bloodGroup) return;
    setLoading(true); setSearched(true);
    try {
      let url = `/inventory/search?bloodGroup=${encodeURIComponent(bloodGroup)}&quantity=${quantity}`;
      if (useLocation && coords) url += `&lat=${coords.lat}&lng=${coords.lng}`;
      setResults(await apiFetch(url));
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {/* Blood group grid */}
      <p className="text-sm font-bold mb-3" style={{ color: RC.textMid }}>Select Blood Group</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {BLOOD_GROUPS.map(g => (
          <button key={g} onClick={() => setBG(g)}
            className="w-14 h-10 rounded-lg text-sm font-black transition-all"
            style={bloodGroup === g
              ? { backgroundColor: RC.crimson, color: '#fff', boxShadow: `0 2px 8px ${RC.crimson}55` }
              : { backgroundColor: '#fff', color: RC.crimson, border: `2px solid ${RC.crimsonLight}` }}>
            {g}
          </button>
        ))}
      </div>

      <div className="flex gap-4 items-end mb-5 flex-wrap">
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: RC.textMid }}>Quantity (units)</label>
          <input type="number" min="1" max="50" value={quantity}
            onChange={e => setQty(+e.target.value || 1)}
            className="p-2 rounded-lg w-28 text-sm font-semibold outline-none"
            style={{ border: `1.5px solid ${RC.crimsonLight}`, color: RC.textDark }} />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer font-medium" style={{ color: RC.textMid }}>
          <input type="checkbox" checked={useLocation} className="accent-pink-600"
            onChange={e => { if (e.target.checked) getLocation(); else setUL(false); }} />
          Sort by nearest
        </label>

        <button onClick={search} disabled={!bloodGroup || loading}
          className="px-6 py-2.5 rounded-lg font-black text-sm transition-all"
          style={{ backgroundColor: bloodGroup ? RC.crimson : '#E0E0E0', color: '#fff' }}>
          {loading ? 'Searching...' : '🔍 Search'}
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <RCCard variant="pink" className="p-5 text-center">
          <p className="font-semibold" style={{ color: RC.crimson }}>
            No blood banks found with {bloodGroup} stock for {quantity} unit(s).
          </p>
          <p className="text-sm mt-1" style={{ color: RC.textMuted }}>Try a different blood group or lower quantity.</p>
        </RCCard>
      )}

      <div className="space-y-3">
        {results.map((r, i) => (
          <RCCard key={i} variant={i % 2 === 0 ? 'pink' : 'green'}>
            <div className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold" style={{ color: RC.textDark }}>{r.location}</p>
                <p className="text-sm mt-0.5" style={{ color: RC.textMid }}>
                  <span className="font-black" style={{ color: RC.crimson }}>{r.quantity}</span> units available
                  {r.distanceKm != null && (
                    <span className="ml-3 font-semibold" style={{ color: RC.greenDark }}>
                      📍 {r.distanceKm} km away
                    </span>
                  )}
                </p>
              </div>
              <button onClick={() => onSelectBank(r, bloodGroup, quantity)}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ backgroundColor: RC.crimson, color: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.crimsonDark}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = RC.crimson}>
                Select & Request →
              </button>
            </div>
          </RCCard>
        ))}
      </div>
    </div>
  );
}

// ── Request ──────────────────────────────────────────────────────────────────
function RequestSection({ selectedBank, prefillBG, prefillQty, onToast }) {
  const [form, setForm]   = useState({ patientName:'', bloodGroup: prefillBG||'', quantity: prefillQty||1, urgency:'NORMAL', notes:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefillBG) setForm(f => ({ ...f, bloodGroup: prefillBG, quantity: prefillQty || 1 }));
  }, [prefillBG, prefillQty]);

  const submit = async () => {
    if (!form.patientName || !form.bloodGroup) { onToast('Patient name and blood group are required.', 'error'); return; }
    setLoading(true);
    try {
      await apiFetch('/requests', { method:'POST', body: JSON.stringify({
        ...form, quantity: +form.quantity,
        hospitalName: localStorage.getItem('entityName') || '',
        bloodBankId: selectedBank?.id ?? null,
      })});
      onToast('🩸 Blood request submitted successfully!');
      setForm({ patientName:'', bloodGroup:'', quantity:1, urgency:'NORMAL', notes:'' });
    } catch (e) { onToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg">
      {selectedBank && (
        <RCCard variant="green" className="p-4 mb-5">
          <p className="text-sm font-bold" style={{ color: RC.greenDark }}>
            🏥 Selected Blood Bank: {selectedBank.location}
            {selectedBank.distanceKm != null && <span className="ml-2 font-normal">· {selectedBank.distanceKm} km away</span>}
          </p>
        </RCCard>
      )}

      {form.urgency === 'URGENT' && (
        <div className="mb-4 p-4 rounded-xl animate-pulse"
          style={{ backgroundColor: '#FDE8F0', border: `2px solid ${RC.crimson}` }}>
          <p className="font-black text-sm" style={{ color: RC.crimson }}>
            🚨 EMERGENCY REQUEST — This will be flagged for immediate priority handling
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Field label="Patient Name">
          <input value={form.patientName} placeholder="Full patient name"
            onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: `1.5px solid #E0E0E0` }}
            onFocus={e => e.target.style.borderColor = RC.crimson}
            onBlur={e => e.target.style.borderColor = '#E0E0E0'} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Blood Group">
            <select value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1.5px solid #E0E0E0` }}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Quantity (units)">
            <input type="number" min="1" max="50" value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: +e.target.value || 1 }))}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: `1.5px solid #E0E0E0` }} />
          </Field>
        </div>

        <Field label="Urgency Level">
          <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: `1.5px solid #E0E0E0`,
              borderColor: form.urgency === 'URGENT' ? RC.crimson : '#E0E0E0' }}>
            <option value="NORMAL">Normal</option>
            <option value="URGENT">🚨 Urgent / Emergency</option>
          </select>
        </Field>

        <Field label="Notes (optional)">
          <textarea value={form.notes} rows={2} placeholder="Additional info for the blood bank"
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ border: `1.5px solid #E0E0E0` }} />
        </Field>

        <button onClick={submit} disabled={loading}
          className="w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all"
          style={{
            backgroundColor: form.urgency === 'URGENT' ? RC.crimson : RC.greenDark,
            color: '#fff',
            opacity: loading ? 0.7 : 1,
          }}>
          {loading ? 'Submitting...' : form.urgency === 'URGENT' ? '🚨 Submit Emergency Request' : '🩸 Submit Blood Request'}
        </button>
      </div>
    </div>
  );
}

// ── Tracking ─────────────────────────────────────────────────────────────────
function TrackingSection() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setData(await apiFetch('/requests/my')); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    let interval;
    const start = () => { interval = setInterval(load, 5000); };
    const stop  = () => clearInterval(interval);
    const vis   = () => document.hidden ? stop() : start();
    document.addEventListener('visibilitychange', vis);
    start();
    return () => { stop(); document.removeEventListener('visibilitychange', vis); };
  }, [load]);

  const urgent = data.filter(r => r.urgency === 'URGENT' && r.status !== 'DELIVERED').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-medium" style={{ color: RC.textMuted }}>Auto-refreshes every 5 seconds</p>
      </div>

      {urgent > 0 && (
        <RCCard variant="pink" className="p-4 mb-4">
          <p className="font-black text-sm" style={{ color: RC.crimson }}>
            🚨 {urgent} urgent request{urgent > 1 ? 's' : ''} currently in progress
          </p>
        </RCCard>
      )}

      {loading ? <p style={{ color: RC.textMuted }}>Loading requests...</p> :
        data.length === 0 ? (
          <RCCard variant="green" className="p-6 text-center">
            <p className="text-2xl mb-2">🩸</p>
            <p className="font-semibold" style={{ color: RC.greenDark }}>No active requests</p>
          </RCCard>
        ) : (
        <div className="space-y-3">
          {[...data].sort((a,b) => (b.urgency==='URGENT')-(a.urgency==='URGENT')).map(r => (
            <RCCard key={r.id} variant={r.urgency === 'URGENT' ? 'pink' : 'white'}
              style={r.urgency === 'URGENT' ? { borderColor: RC.crimson, borderWidth: '2px' } : {}}>
              <div className="p-4">
                {r.urgency === 'URGENT' && (
                  <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: RC.crimson }}>
                    🚨 Emergency — Urgent Priority
                  </p>
                )}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-black" style={{ color: RC.crimson }}>
                      {r.bloodGroup} · {r.quantity} unit{r.quantity > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm" style={{ color: RC.textMid }}>{r.patientName}</p>
                    {r.bloodBankName && <p className="text-xs" style={{ color: RC.textMuted }}>Bank: {r.bloodBankName}</p>}
                    {r.riderName && <p className="text-xs font-semibold" style={{ color: RC.greenDark }}>🏍 Rider: {r.riderName}</p>}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {DELIVERY_STEPS.includes(r.status) && <ProgressBar status={r.status} />}
              </div>
            </RCCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History ──────────────────────────────────────────────────────────────────
function HistorySection() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/requests/my/history').then(setHistory).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label:'Total Requests',  value: history.length,                                      variant:'blue'    },
    { label:'Delivered',        value: history.filter(r=>r.status==='DELIVERED').length,    variant:'green'   },
    { label:'Emergency Handled',value: history.filter(r=>r.urgency==='URGENT').length,      variant:'crimson' },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => <StatPill key={s.label} {...s} />)}
      </div>

      {loading ? <p style={{ color: RC.textMuted }}>Loading history...</p> :
        history.length === 0 ? (
          <RCCard variant="green" className="p-6 text-center">
            <p className="font-semibold" style={{ color: RC.greenDark }}>No completed requests yet</p>
          </RCCard>
        ) : (
        <RCCard variant="white" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}>
                {['Patient','Blood','Qty','Urgency','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-black"
                    style={{ color: RC.crimson }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i%2===0 ? '#fff' : RC.pinkSoft,
                  borderBottom: '1px solid #F5E0E8' }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: RC.textDark }}>{r.patientName}</td>
                  <td className="px-4 py-3 font-black" style={{ color: RC.crimson }}>{r.bloodGroup}</td>
                  <td className="px-4 py-3" style={{ color: RC.textMid }}>{r.quantity}</td>
                  <td className="px-4 py-3">
                    {r.urgency === 'URGENT'
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: RC.pinkBg, color: RC.crimson }}>🚨 Urgent</span>
                      : <span className="text-xs" style={{ color: RC.textMuted }}>Normal</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </RCCard>
      )}
    </div>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1" style={{ color: RC.textMid }}>{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:    { bg: RC.cardYellow,  color: '#E65100' },
    ACCEPTED:   { bg: RC.greenLight,  color: RC.greenDark },
    REJECTED:   { bg: RC.pinkBg,      color: RC.crimson },
    ASSIGNED:   { bg: '#EDE7F6',      color: '#512DA8' },
    IN_TRANSIT: { bg: RC.cardBlue,    color: '#1565C0' },
    DELIVERED:  { bg: RC.greenLight,  color: RC.greenDark },
  };
  const s = map[status] || { bg: '#F5F5F5', color: RC.textMid };
  return (
    <span className="text-xs font-bold px-2 py-1 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>{status.replace('_',' ')}</span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HospitalDashboard({ onLogout }) {
  const [tab, setTab]           = useState('search');
  const [selectedBank, setBank] = useState(null);
  const [prefillBG, setPBG]     = useState('');
  const [prefillQty, setPQty]   = useState(1);
  const [toast, setToast]       = useState(null);
  const entityName = localStorage.getItem('entityName') || 'Hospital';
  const showToast  = (msg, type='success') => setToast({ msg, type });

  const handleSelectBank = (bank, bg, qty) => {
    setBank(bank); setPBG(bg); setPQty(qty); setTab('request');
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: RC.pinkSoft }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
      <RCSidebar role="HOSPITAL" entityName={entityName} tabs={TABS}
        activeTab={tab} onTabChange={setTab} onLogout={onLogout} />
      <div className="flex-1 flex flex-col">
        <PageHeader title={TABS.find(t=>t.key===tab)?.icon + ' ' + TABS.find(t=>t.key===tab)?.label} />
        <main className="flex-1 p-8 overflow-y-auto">
          {tab==='search'   && <SearchSection onSelectBank={handleSelectBank} />}
          {tab==='request'  && <RequestSection selectedBank={selectedBank} prefillBG={prefillBG} prefillQty={prefillQty} onToast={showToast} />}
          {tab==='tracking' && <TrackingSection />}
          {tab==='history'  && <HistorySection />}
        </main>
      </div>
    </div>
  );
}
