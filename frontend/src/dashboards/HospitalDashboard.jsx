import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api/api';
import RCSidebar from '../components/RCSidebar';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC } from '../components/RCTheme';

const BLOOD_GROUPS   = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const DELIVERY_STEPS = ['ASSIGNED','IN_TRANSIT','DELIVERED'];

const TABS = [
  { key:'search',   icon:'🔍', label:'Find Blood'    },
  { key:'request',  icon:'🩸', label:'New Request'   },
  { key:'tracking', icon:'📡', label:'Live Tracking' },
  { key:'history',  icon:'📊', label:'History'       },
];

/* ── Shared helpers ─────────────────────────────────────────── */
function PageHeader({ title, subtitle }) {
  return (
    <div style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}`, padding: '14px 28px' }}>
      <h2 style={{ margin: 0, fontWeight: 900, fontSize: '17px', color: RC.crimson }}>{title}</h2>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: '12px', color: RC.textMuted }}>{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:   { bg: RC.cardYellow,  color: '#E65100' },
    ACCEPTED:  { bg: RC.greenLight,  color: RC.greenDark },
    REJECTED:  { bg: RC.pinkBg,      color: RC.crimson },
    CANCELLED: { bg: '#F5F5F5',       color: '#888' },
    ASSIGNED:  { bg: '#EDE7F6',      color: '#512DA8' },
    IN_TRANSIT:{ bg: RC.cardBlue,    color: '#1565C0' },
    DELIVERED: { bg: RC.greenLight,  color: RC.greenDark },
  };
  const s = map[status] || { bg: '#F5F5F5', color: RC.textMid };
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px',
      backgroundColor: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {status?.replace('_',' ')}
    </span>
  );
}

function ProgressBar({ status }) {
  const idx = DELIVERY_STEPS.indexOf(status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
      {DELIVERY_STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: i <= idx ? RC.crimson : '#E0E0E0', transition: 'background 0.3s' }} />
          {i < DELIVERY_STEPS.length - 1 && (
            <div style={{ height: '3px', width: '32px', borderRadius: '2px',
              backgroundColor: i < idx ? RC.crimson : '#E0E0E0', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
      <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, color: RC.textMid }}>
        {status.replace('_',' ')}
      </span>
    </div>
  );
}

/* ── Receipt Upload ─────────────────────────────────────────── */
function ReceiptUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/jpg','application/pdf'];
    if (!allowed.includes(file.type)) {
      alert('Only JPG, PNG or PDF files are accepted for receipts.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum allowed size is 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({ data: e.target.result.split(',')[1], name: file.name, mime: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '6px' }}>
        Hospital Receipt / Prescription <span style={{ color: RC.crimson }}>*</span>
      </label>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
          backgroundColor: RC.greenLight, border: `1.5px solid ${RC.greenMid}`, borderRadius: '10px' }}>
          <span style={{ fontSize: '20px' }}>{value.mime === 'application/pdf' ? '📄' : '🖼️'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: RC.greenDark,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</p>
            <p style={{ margin: 0, fontSize: '11px', color: RC.textMuted }}>Receipt attached ✓</p>
          </div>
          <button onClick={() => onChange(null)} style={{ background: 'none', border: 'none',
            color: RC.crimson, fontWeight: 900, fontSize: '16px', cursor: 'pointer', padding: '0 4px' }}>
            ×
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? RC.crimson : RC.crimsonLight}`,
            borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer',
            backgroundColor: dragOver ? RC.pinkBg : '#FAFAFA', transition: 'all 0.2s',
          }}>
          <div style={{ fontSize: '28px', marginBottom: '6px' }}>📎</div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: RC.textMid }}>
            Drag & drop or <span style={{ color: RC.crimson, textDecoration: 'underline' }}>browse</span>
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: RC.textMuted }}>
            JPG, PNG or PDF · Max 5 MB
          </p>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf"
            style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}
    </div>
  );
}

/* ── View Receipt Modal ─────────────────────────────────────── */
function ReceiptModal({ request, onClose }) {
  if (!request?.receiptData) return null;
  const src = `data:${request.receiptMimeType};base64,${request.receiptData}`;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex',
      alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px',
        maxWidth: '680px', width: '94vw', maxHeight: '85vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <p style={{ margin: 0, fontWeight: 900, color: RC.crimson, fontSize: '15px' }}>
            📎 {request.receiptFileName || 'Receipt'}
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none',
            fontSize: '22px', cursor: 'pointer', color: RC.textMid, lineHeight: 1 }}>×</button>
        </div>
        {request.receiptMimeType === 'application/pdf' ? (
          <embed src={src} type="application/pdf" style={{ width: '100%', height: '500px', borderRadius: '8px' }} />
        ) : (
          <img src={src} alt="Receipt" style={{ width: '100%', borderRadius: '8px', objectFit: 'contain' }} />
        )}
        <a href={src} download={request.receiptFileName || 'receipt'}
          style={{ display: 'block', marginTop: '12px', textAlign: 'center',
            color: RC.crimson, fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
          ⬇ Download Receipt
        </a>
      </div>
    </div>
  );
}

/* ── Search ─────────────────────────────────────────────────── */
function SearchSection({ onSelectBank }) {
  const [bloodGroup, setBG]   = useState('');
  const [quantity, setQty]    = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [useLocation, setUL]  = useState(false);
  const [coords, setCoords]   = useState(null);
  const [locErr, setLocErr]   = useState('');

  const getLocation = () => {
    if (!navigator.geolocation) { setLocErr('Geolocation not supported by your browser.'); return; }
    navigator.geolocation.getCurrentPosition(
      p => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setUL(true); setLocErr(''); },
      () => { setLocErr('Location access denied. Enable location or search without it.'); setUL(false); }
    );
  };

  const search = async () => {
    if (!bloodGroup) { alert('Please select a blood group first.'); return; }
    if (quantity < 1 || quantity > 50) { alert('Quantity must be between 1 and 50 units.'); return; }
    setLoading(true); setSearched(true);
    try {
      let url = `/inventory/search?bloodGroup=${encodeURIComponent(bloodGroup)}&quantity=${quantity}`;
      if (useLocation && coords) url += `&lat=${coords.lat}&lng=${coords.lng}`;
      const data = await apiFetch(url);
      setResults(data || []);
    } catch (e) {
      alert('Search failed: ' + e.message);
      setResults([]);
    } finally { setLoading(false); }
  };

  return (
    <div>
      {/* Blood group selector */}
      <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: RC.textMid }}>
        Select Blood Group
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {BLOOD_GROUPS.map(g => (
          <button key={g} onClick={() => setBG(g)} style={{
            width: '56px', height: '42px', borderRadius: '10px', fontWeight: 900,
            fontSize: '13px', border: '2px solid', cursor: 'pointer', transition: 'all 0.15s',
            backgroundColor: bloodGroup === g ? RC.crimson : '#fff',
            color: bloodGroup === g ? '#fff' : RC.crimson,
            borderColor: bloodGroup === g ? RC.crimsonDark : RC.crimsonLight,
            boxShadow: bloodGroup === g ? `0 3px 8px ${RC.crimson}44` : 'none',
          }}>{g}</button>
        ))}
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '5px', color: RC.textMid }}>
            Quantity (units)
          </label>
          <input type="number" min="1" max="50" value={quantity}
            onChange={e => setQty(Math.max(1, Math.min(50, +e.target.value || 1)))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: `1.5px solid ${RC.crimsonLight}`,
              width: '100px', fontSize: '14px', fontWeight: 600, outline: 'none', color: RC.textDark }} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500, color: RC.textMid }}>
          <input type="checkbox" checked={useLocation} style={{ accentColor: RC.crimson, width: '15px', height: '15px' }}
            onChange={e => { if (e.target.checked) getLocation(); else setUL(false); }} />
          📍 Sort by nearest
        </label>
        <button onClick={search} disabled={!bloodGroup || loading}
          style={{ padding: '9px 24px', borderRadius: '10px', fontWeight: 900, fontSize: '13px',
            border: 'none', cursor: !bloodGroup ? 'not-allowed' : 'pointer',
            backgroundColor: bloodGroup ? RC.crimson : '#C0C0C0', color: '#fff', transition: 'all 0.2s' }}>
          {loading ? '⏳ Searching...' : '🔍 Search Blood Banks'}
        </button>
      </div>

      {locErr && <p style={{ fontSize: '12px', color: RC.crimson, marginBottom: '12px' }}>⚠ {locErr}</p>}

      {/* Results */}
      {searched && !loading && results.length === 0 && (
        <RCCard variant="pink" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>😔</p>
          <p style={{ fontWeight: 700, color: RC.crimson, margin: 0 }}>
            No blood banks found with {bloodGroup} ({quantity} unit{quantity > 1 ? 's' : ''})
          </p>
          <p style={{ fontSize: '13px', color: RC.textMuted, marginTop: '6px' }}>
            Try a different blood group, reduce quantity, or contact blood banks directly.
          </p>
        </RCCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {results.map((r, i) => (
          <RCCard key={i} variant={i % 2 === 0 ? 'pink' : 'green'}>
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: RC.textDark }}>{r.location}</p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: RC.textMid }}>
                    🩸 <strong style={{ color: RC.crimson }}>{r.quantity}</strong> units of <strong>{r.bloodGroup}</strong>
                  </span>
                  {r.distanceKm != null && (
                    <span style={{ fontSize: '13px', color: RC.greenDark, fontWeight: 600 }}>
                      📍 {r.distanceKm} km away
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => onSelectBank(r, bloodGroup, quantity)}
                style={{ padding: '9px 18px', borderRadius: '10px', fontWeight: 900, fontSize: '13px',
                  backgroundColor: RC.crimson, color: '#fff', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', transition: 'background 0.2s' }}
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

/* ── Request ─────────────────────────────────────────────────── */
function RequestSection({ selectedBank, prefillBG, prefillQty, onToast, onTabChange }) {
  const [form, setForm] = useState({
    patientName: '', bloodGroup: prefillBG || '', quantity: prefillQty || 1,
    urgency: 'NORMAL', notes: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (prefillBG) setForm(f => ({ ...f, bloodGroup: prefillBG, quantity: prefillQty || 1 }));
  }, [prefillBG, prefillQty]);

  const validate = () => {
    const e = {};
    if (!form.patientName.trim() || form.patientName.trim().length < 2)
      e.patientName = 'Patient name must be at least 2 characters.';
    if (!form.bloodGroup)
      e.bloodGroup = 'Please select a blood group.';
    if (form.quantity < 1 || form.quantity > 50)
      e.quantity = 'Quantity must be between 1 and 50.';
    if (!selectedBank)
      e.bloodBank = 'You must search for and select a blood bank first. Go to the "Find Blood" tab.';
    if (!receipt)
      e.receipt = 'Hospital receipt or prescription is required to submit a blood request.';
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await apiFetch('/requests', { method: 'POST', body: JSON.stringify({
        patientName:     form.patientName.trim(),
        bloodGroup:      form.bloodGroup,
        quantity:        +form.quantity,
        urgency:         form.urgency,
        notes:           form.notes.trim() || null,
        bloodBankId:     selectedBank.id,
        hospitalName:    localStorage.getItem('entityName') || '',
        receiptData:     receipt?.data || null,
        receiptFileName: receipt?.name || null,
        receiptMimeType: receipt?.mime || null,
      })});
      onToast('🩸 Blood request submitted successfully! The blood bank will review and respond shortly.');
      setForm({ patientName: '', bloodGroup: prefillBG || '', quantity: 1, urgency: 'NORMAL', notes: '' });
      setReceipt(null);
      setErrors({});
      onTabChange('tracking');
    } catch (e) {
      onToast('❌ ' + e.message, 'error');
    } finally { setLoading(false); }
  };

  const F = ({ label, error, required, children }) => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '5px', color: RC.textMid }}>
        {label} {required && <span style={{ color: RC.crimson }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: '4px 0 0', fontSize: '12px', color: RC.crimson, fontWeight: 600 }}>⚠ {error}</p>}
    </div>
  );

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '9px 13px', borderRadius: '9px', outline: 'none',
    border: `1.5px solid ${hasErr ? RC.crimson : '#E0E0E0'}`, fontSize: '13px',
    color: RC.textDark, boxSizing: 'border-box', transition: 'border 0.2s',
  });

  return (
    <div style={{ maxWidth: '580px' }}>
      {/* Blood bank selection banner */}
      {selectedBank ? (
        <RCCard variant="green" style={{ padding: '12px 16px', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: RC.greenDark }}>
            ✅ Blood Bank Selected: <strong>{selectedBank.location}</strong>
            {selectedBank.distanceKm != null && <span style={{ fontWeight: 400 }}> · {selectedBank.distanceKm} km away</span>}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: RC.textMuted }}>
            {selectedBank.quantity} units of {selectedBank.bloodGroup} available
          </p>
        </RCCard>
      ) : (
        <RCCard variant="pink" style={{ padding: '14px 16px', marginBottom: '20px', border: `2px solid ${RC.crimson}` }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: RC.crimson }}>
            ⚠ No blood bank selected
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: RC.textMid }}>
            Please go to the <strong>"Find Blood"</strong> tab first, search for availability and click{' '}
            <strong>"Select & Request"</strong> to choose a blood bank.
          </p>
          <button onClick={() => onTabChange('search')} style={{
            marginTop: '8px', padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
            fontWeight: 700, backgroundColor: RC.crimson, color: '#fff', border: 'none', cursor: 'pointer',
          }}>
            → Go to Find Blood
          </button>
        </RCCard>
      )}

      {form.urgency === 'URGENT' && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
          backgroundColor: '#FDE8F0', border: `2px solid ${RC.crimson}`,
          animation: 'pulse 1.5s infinite' }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: '13px', color: RC.crimson }}>
            🚨 EMERGENCY REQUEST — This will be flagged for immediate priority handling by the blood bank.
          </p>
        </div>
      )}

      <F label="Patient Name" error={errors.patientName} required>
        <input value={form.patientName} placeholder="Full name of patient"
          onChange={e => { setForm(f => ({ ...f, patientName: e.target.value })); setErrors(er => ({ ...er, patientName: '' })); }}
          style={inputStyle(!!errors.patientName)}
          onFocus={e => e.target.style.borderColor = RC.crimson}
          onBlur={e => e.target.style.borderColor = errors.patientName ? RC.crimson : '#E0E0E0'} />
      </F>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <F label="Blood Group" error={errors.bloodGroup} required>
          <select value={form.bloodGroup}
            onChange={e => { setForm(f => ({ ...f, bloodGroup: e.target.value })); setErrors(er => ({ ...er, bloodGroup: '' })); }}
            style={inputStyle(!!errors.bloodGroup)}>
            <option value="">Select</option>
            {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
        </F>
        <F label="Quantity (units)" error={errors.quantity} required>
          <input type="number" min="1" max="50" value={form.quantity}
            onChange={e => { setForm(f => ({ ...f, quantity: +e.target.value || 1 })); setErrors(er => ({ ...er, quantity: '' })); }}
            style={inputStyle(!!errors.quantity)} />
        </F>
      </div>

      <F label="Urgency Level" required>
        <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
          style={{ ...inputStyle(false), borderColor: form.urgency === 'URGENT' ? RC.crimson : '#E0E0E0' }}>
          <option value="NORMAL">Normal</option>
          <option value="URGENT">🚨 Urgent / Emergency</option>
        </select>
      </F>

      <F label="Additional Notes (optional)">
        <textarea value={form.notes} rows={2} placeholder="Any additional information for the blood bank..."
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          style={{ ...inputStyle(false), resize: 'none' }} />
      </F>

      <div style={{ marginBottom: '18px' }}>
        <ReceiptUpload value={receipt} onChange={setReceipt} />
        {errors.receipt && <p style={{ margin: '5px 0 0', fontSize: '12px', color: RC.crimson, fontWeight: 600 }}>⚠ {errors.receipt}</p>}
      </div>

      {errors.bloodBank && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px',
          backgroundColor: RC.pinkBg, border: `1.5px solid ${RC.crimson}` }}>
          <p style={{ margin: 0, fontSize: '12px', color: RC.crimson, fontWeight: 700 }}>⚠ {errors.bloodBank}</p>
        </div>
      )}

      <button onClick={submit} disabled={loading}
        style={{ width: '100%', padding: '13px', borderRadius: '12px', fontWeight: 900, fontSize: '14px',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          backgroundColor: form.urgency === 'URGENT' ? RC.crimson : RC.greenDark,
          color: '#fff', opacity: loading ? 0.7 : 1 }}>
        {loading ? '⏳ Submitting...' : form.urgency === 'URGENT' ? '🚨 Submit Emergency Request' : '🩸 Submit Blood Request'}
      </button>
    </div>
  );
}

/* ── Tracking ─────────────────────────────────────────────────── */
function TrackingSection({ onToast }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCanc] = useState(null);
  const [viewReceipt, setVR]  = useState(null);

  const load = useCallback(async () => {
    try {
      setData((await apiFetch('/requests/my') || []).filter(
        r => !['DELIVERED','REJECTED','CANCELLED'].includes(r.status)));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 6000);
    const vis = () => document.hidden ? clearInterval(iv) : null;
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', vis); };
  }, [load]);

  const cancelRequest = async (id) => {
    if (!window.confirm('Cancel this blood request? This action cannot be undone.')) return;
    setCanc(id);
    try {
      await apiFetch(`/requests/${id}/cancel`, { method: 'PUT' });
      onToast('Request cancelled successfully.');
      load();
    } catch (e) { onToast('❌ ' + e.message, 'error'); }
    finally { setCanc(null); }
  };

  const urgent = data.filter(r => r.urgency === 'URGENT').length;

  return (
    <div>
      {viewReceipt && <ReceiptModal request={viewReceipt} onClose={() => setVR(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ margin: 0, fontSize: '12px', color: RC.textMuted }}>⟳ Auto-refreshes every 6 seconds</p>
        <button onClick={load} style={{ padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
          fontWeight: 700, backgroundColor: RC.greenLight, color: RC.greenDark, border: `1px solid ${RC.greenMid}`, cursor: 'pointer' }}>
          ↻ Refresh Now
        </button>
      </div>

      {urgent > 0 && (
        <RCCard variant="pink" style={{ padding: '12px 16px', marginBottom: '14px', border: `2px solid ${RC.crimson}` }}>
          <p style={{ margin: 0, fontWeight: 900, fontSize: '13px', color: RC.crimson }}>
            🚨 {urgent} urgent request{urgent > 1 ? 's' : ''} currently in progress
          </p>
        </RCCard>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>⏳ Loading requests...</div>
      ) : data.length === 0 ? (
        <RCCard variant="green" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '36px', margin: '0 0 10px' }}>✅</p>
          <p style={{ fontWeight: 700, color: RC.greenDark, margin: 0 }}>No active requests</p>
          <p style={{ fontSize: '13px', color: RC.textMuted, marginTop: '4px' }}>
            All your requests have been resolved.
          </p>
        </RCCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[...data].sort((a,b) => (b.urgency==='URGENT')-(a.urgency==='URGENT')).map(r => (
            <RCCard key={r.id} variant={r.urgency === 'URGENT' ? 'pink' : 'white'}
              style={r.urgency === 'URGENT' ? { border: `2px solid ${RC.crimson}` } : {}}>
              <div style={{ padding: '16px' }}>
                {r.urgency === 'URGENT' && (
                  <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.5px', color: RC.crimson }}>
                    🚨 Emergency — Urgent Priority
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '16px', color: RC.crimson }}>
                      {r.bloodGroup} · {r.quantity} unit{r.quantity > 1 ? 's' : ''}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: RC.textMid }}>
                      Patient: {r.patientName}
                    </p>
                    {r.bloodBankName && (
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: RC.textMuted }}>
                        🏥 Bank: {r.bloodBankName}
                      </p>
                    )}
                    {r.riderName && (
                      <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, color: RC.greenDark }}>
                        🏍 Rider: {r.riderName}
                      </p>
                    )}
                    {(r.status === 'ASSIGNED' || r.status === 'IN_TRANSIT') && r.deliveryOtp && (
                      <div style={{ marginTop: '6px', padding: '7px 12px', borderRadius: '8px',
                        backgroundColor: RC.cardYellow, border: '1.5px solid #FFD54F', display: 'inline-block' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#E65100' }}>
                          🔐 Delivery OTP: <span style={{ fontSize: '18px', letterSpacing: '4px' }}>
                            {r.deliveryOtp}
                          </span>
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#E65100' }}>
                          Share this OTP with the rider upon delivery
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <StatusBadge status={r.status} />
                    {r.hasReceipt && (
                      <button onClick={() => setVR(r)}
                        style={{ padding: '4px 10px', borderRadius: '7px', fontSize: '11px',
                          fontWeight: 700, backgroundColor: RC.cardBlue, color: '#1565C0',
                          border: '1px solid #90CAF9', cursor: 'pointer' }}>
                        📎 Receipt
                      </button>
                    )}
                  </div>
                </div>
                {DELIVERY_STEPS.includes(r.status) && <ProgressBar status={r.status} />}
                {r.status === 'PENDING' && (
                  <button onClick={() => cancelRequest(r.id)} disabled={cancelling === r.id}
                    style={{ marginTop: '12px', padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                      fontWeight: 700, backgroundColor: '#FDE8F0', color: RC.crimson,
                      border: `1.5px solid ${RC.crimsonLight}`, cursor: 'pointer' }}>
                    {cancelling === r.id ? 'Cancelling...' : '✕ Cancel Request'}
                  </button>
                )}
              </div>
            </RCCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── History ─────────────────────────────────────────────────── */
function HistorySection() {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [viewReceipt, setVR]    = useState(null);

  useEffect(() => {
    apiFetch('/requests/my/history')
      .then(d => setHistory(d || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? history
    : history.filter(r => r.status === filter);

  const stats = [
    { label: 'Total Requests',    value: history.length,                                     bg: RC.cardBlue,   color: '#1565C0', border: '#90CAF9' },
    { label: 'Delivered',         value: history.filter(r => r.status === 'DELIVERED').length, bg: RC.greenLight, color: RC.greenDark, border: RC.greenMid },
    { label: 'Rejected',          value: history.filter(r => r.status === 'REJECTED').length,  bg: RC.pinkBg,    color: RC.crimson, border: RC.crimsonLight },
    { label: 'Emergency Handled', value: history.filter(r => r.urgency === 'URGENT').length,   bg: RC.cardYellow, color: '#E65100', border: '#FFD54F' },
  ];

  return (
    <div>
      {viewReceipt && <ReceiptModal request={viewReceipt} onClose={() => setVR(null)} />}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ borderRadius: '12px', padding: '14px', textAlign: 'center',
            backgroundColor: s.bg, border: `1.5px solid ${s.border}` }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: RC.textMid, marginTop: '3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['ALL','DELIVERED','REJECTED','CANCELLED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
              border: '1.5px solid', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: filter === f ? RC.crimson : '#fff',
              color: filter === f ? '#fff' : RC.crimson,
              borderColor: filter === f ? RC.crimsonDark : RC.crimsonLight }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>Loading history...</div>
      ) : filtered.length === 0 ? (
        <RCCard variant="green" style={{ padding: '30px', textAlign: 'center' }}>
          <p style={{ color: RC.greenDark, fontWeight: 600, margin: 0 }}>No records found</p>
        </RCCard>
      ) : (
        <RCCard variant="white" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}>
                {['#','Patient','Blood','Qty','Blood Bank','Urgency','Status','Receipt'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: '11px',
                    fontWeight: 900, color: RC.crimson }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : RC.pinkSoft,
                  borderBottom: '1px solid #F5E0E8' }}>
                  <td style={{ padding: '10px 14px', color: RC.textMuted, fontSize: '11px' }}>#{r.id}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: RC.textDark }}>{r.patientName}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 900, color: RC.crimson }}>{r.bloodGroup}</td>
                  <td style={{ padding: '10px 14px', color: RC.textMid }}>{r.quantity}</td>
                  <td style={{ padding: '10px 14px', color: RC.textMid, maxWidth: '120px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.bloodBankName || '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {r.urgency === 'URGENT'
                      ? <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                          backgroundColor: RC.pinkBg, color: RC.crimson }}>🚨 Urgent</span>
                      : <span style={{ fontSize: '11px', color: RC.textMuted }}>Normal</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    {r.hasReceipt ? (
                      <button onClick={() => setVR(r)}
                        style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: RC.cardBlue, color: '#1565C0', border: '1px solid #90CAF9', cursor: 'pointer' }}>
                        View
                      </button>
                    ) : <span style={{ color: RC.textMuted, fontSize: '11px' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </RCCard>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function HospitalDashboard({ onLogout }) {
  const [tab, setTab]           = useState('search');
  const [selectedBank, setBank] = useState(null);
  const [prefillBG, setPBG]     = useState('');
  const [prefillQty, setPQty]   = useState(1);
  const [toast, setToast]       = useState(null);
  const entityName = localStorage.getItem('entityName') || 'Hospital';
  const showToast  = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const handleSelectBank = (bank, bg, qty) => {
    setBank(bank); setPBG(bg); setPQty(qty); setTab('request');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: RC.pinkSoft }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
      <RCSidebar role="HOSPITAL" entityName={entityName} tabs={TABS}
        activeTab={tab} onTabChange={setTab} onLogout={onLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <PageHeader
          title={`${TABS.find(t=>t.key===tab)?.icon} ${TABS.find(t=>t.key===tab)?.label}`}
          subtitle="RC Foundation — Blood Management System" />
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {tab === 'search'   && <SearchSection onSelectBank={handleSelectBank} />}
          {tab === 'request'  && <RequestSection selectedBank={selectedBank} prefillBG={prefillBG}
              prefillQty={prefillQty} onToast={showToast} onTabChange={setTab} />}
          {tab === 'tracking' && <TrackingSection onToast={showToast} />}
          {tab === 'history'  && <HistorySection />}
        </main>
      </div>
    </div>
  );
}
