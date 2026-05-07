import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../api/api';
import RCSidebar from '../components/RCSidebar';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC, STATUS_CONFIG } from '../components/RCTheme';

const BG = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'PCV', 'FFP', 'SDP', 'Platelets'];
const STEPS = ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];
const TABS = [
    { key: 'search', icon: '🔍', label: 'Find Blood' },
    { key: 'request', icon: '🩸', label: 'New Request' },
    { key: 'tracking', icon: '📡', label: 'Live Tracking' },
    { key: 'history', icon: '📊', label: 'History' },
];

const SI = (err, extra = {}) => ({
    width: '100%', padding: '9px 13px', borderRadius: '9px',
    border: `1.5px solid ${err ? RC.crimson : '#E0E0E0'}`, fontSize: '13px', color: RC.textDark,
    outline: 'none', boxSizing: 'border-box', ...extra
});

function Badge({ status }) {
    const cfg = STATUS_CONFIG[status] || { bg: '#F5F5F5', color: RC.textMid, border: '#E0E0E0', label: status };
    return <span style={{
        fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
        backgroundColor: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border || '#E0E0E0'}`, whiteSpace: 'nowrap'
    }}>{cfg.label || status?.replace('_', ' ')}</span>;
}

function UrgencyBadge({ urgency }) {
    if (urgency === 'CRITICAL') return <span style={{
        fontSize: '11px', fontWeight: 900, padding: '3px 8px',
        borderRadius: '20px', backgroundColor: RC.crimson, color: '#fff'
    }}>🚨 CRITICAL</span>;
    if (urgency === 'URGENT') return <span style={{
        fontSize: '11px', fontWeight: 900, padding: '3px 8px',
        borderRadius: '20px', backgroundColor: RC.pinkBg, color: RC.crimson
    }}>⚡ URGENT</span>;
    return <span style={{ fontSize: '11px', color: RC.textMuted }}>Normal</span>;
}

function ProgressTracker({ status }) {
    const idx = STEPS.indexOf(status);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
            {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        backgroundColor: i <= idx ? RC.crimson : '#E0E0E0', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        {i < idx && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
                    </div>
                    {i < STEPS.length - 1 && <div style={{
                        width: '36px', height: '3px', borderRadius: '2px',
                        backgroundColor: i < idx ? RC.crimson : '#E0E0E0'
                    }} />}
                </div>
            ))}
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 600, color: RC.textMid }}>
                {status.replace('_', ' ')}
            </span>
        </div>
    );
}

function ReceiptUpload({ value, onChange }) {
    const ref = useRef(null);
    const [drag, setDrag] = useState(false);
    const handle = f => {
        if (!f) return;
        if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(f.type))
            return alert('Only JPG, PNG, or PDF accepted.');
        if (f.size > 5 * 1024 * 1024) return alert('Max file size is 5 MB.');
        const r = new FileReader();
        r.onload = e => onChange({ data: e.target.result.split(',')[1], name: f.name, mime: f.type });
        r.readAsDataURL(f);
    };
    return (
        <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '6px' }}>
                Hospital Receipt / Prescription <span style={{ color: RC.crimson }}>*</span>
            </label>
            {value ? (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                    backgroundColor: RC.greenLight, border: `1.5px solid ${RC.greenMid}`, borderRadius: '10px'
                }}>
                    <span style={{ fontSize: '20px' }}>{value.mime === 'application/pdf' ? '📄' : '🖼️'}</span>
                    <p style={{
                        flex: 1, margin: 0, fontWeight: 700, fontSize: '13px', color: RC.greenDark,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{value.name}</p>
                    <button onClick={() => onChange(null)} style={{
                        background: 'none', border: 'none',
                        color: RC.crimson, fontWeight: 900, fontSize: '18px', cursor: 'pointer'
                    }}>×</button>
                </div>
            ) : (
                <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
                    onClick={() => ref.current?.click()}
                    style={{
                        border: `2px dashed ${drag ? RC.crimson : RC.crimsonLight}`, borderRadius: '10px',
                        padding: '20px', textAlign: 'center', cursor: 'pointer',
                        backgroundColor: drag ? RC.pinkBg : '#FAFAFA'
                    }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📎</div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: RC.textMid }}>
                        Drag & drop or <span style={{ color: RC.crimson, textDecoration: 'underline' }}>browse</span>
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: RC.textMuted }}>JPG, PNG or PDF · Max 5 MB</p>
                    <input ref={ref} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                        onChange={e => handle(e.target.files[0])} />
                </div>
            )}
        </div>
    );
}

// ── Search Tab ────────────────────────────────────────────────────────────────
function SearchTab({ onSelectBank }) {
    const [bg, setBG] = useState('');
    const [qty, setQty] = useState(1);
    const [comp, setComp] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [useGeo, setUseGeo] = useState(false);
    const [coords, setCoords] = useState(null);
    const [geoErr, setGeoErr] = useState('');

    const locate = () => {
        if (!navigator.geolocation) { setGeoErr('Geolocation not supported.'); return; }
        navigator.geolocation.getCurrentPosition(
            p => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setUseGeo(true); setGeoErr(''); },
            () => { setGeoErr('Location denied. Enable location or search without it.'); setUseGeo(false); }
        );
    };

    const search = async () => {
        if (!bg) { alert('Please select a blood group.'); return; }
        setLoading(true); setSearched(true);
        try {
            let url = `/inventory/search?bloodGroup=${encodeURIComponent(bg)}&quantity=${qty}`;
            if (comp) url += `&component=${encodeURIComponent(comp)}`;
            if (useGeo && coords) url += `&lat=${coords.lat}&lng=${coords.lng}`;
            setResults(await apiFetch(url) || []);
        } catch (e) { alert('Search failed: ' + e.message); setResults([]); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <p style={{ fontWeight: 700, fontSize: '13px', color: RC.textMid, marginBottom: '10px' }}>Select Blood Group</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                {BG.map(g => (
                    <button key={g} onClick={() => setBG(g)}
                        style={{
                            width: '54px', height: '40px', borderRadius: '10px', fontWeight: 900, fontSize: '13px',
                            border: '2px solid', cursor: 'pointer',
                            backgroundColor: bg === g ? RC.crimson : '#fff',
                            color: bg === g ? '#fff' : RC.crimson,
                            borderColor: bg === g ? RC.crimsonDark : RC.crimsonLight
                        }}>{g}</button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: RC.textMid }}>
                        Quantity (units)
                    </label>
                    <input type="number" min="1" max="50" value={qty}
                        onChange={e => setQty(Math.max(1, Math.min(50, +e.target.value || 1)))}
                        style={{ ...SI(false), width: '90px' }} />
                </div>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: RC.textMid }}>
                        Component (optional)
                    </label>
                    <select value={comp} onChange={e => setComp(e.target.value)} style={{ ...SI(false), width: '140px' }}>
                        <option value="">Any</option>
                        {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: RC.textMid }}>
                    <input type="checkbox" checked={useGeo} style={{ accentColor: RC.crimson, width: '15px', height: '15px' }}
                        onChange={e => { if (e.target.checked) locate(); else setUseGeo(false); }} />
                    📍 Sort by nearest
                </label>
                <button onClick={search} disabled={!bg || loading}
                    style={{
                        padding: '9px 22px', borderRadius: '10px', fontWeight: 900, fontSize: '13px', border: 'none',
                        cursor: !bg ? 'not-allowed' : 'pointer', backgroundColor: bg ? RC.crimson : '#C0C0C0', color: '#fff'
                    }}>
                    {loading ? '⏳ Searching…' : '🔍 Search'}
                </button>
            </div>

            {geoErr && <p style={{ fontSize: '12px', color: RC.crimson, marginBottom: '10px' }}>⚠ {geoErr}</p>}

            {searched && !loading && results.length === 0 && (
                <RCCard variant="pink" style={{ padding: '28px', textAlign: 'center' }}>
                    <p style={{ fontSize: '32px', margin: '0 0 8px' }}>😔</p>
                    <p style={{ fontWeight: 700, color: RC.crimson, margin: 0 }}>
                        No blood banks found with {bg} ({qty} unit{qty > 1 ? 's' : ''})
                    </p>
                    <p style={{ fontSize: '13px', color: RC.textMuted, marginTop: '6px' }}>
                        Try a different group, reduce quantity, or contact blood banks directly.
                    </p>
                </RCCard>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.map((r, i) => (
                    <RCCard key={i} variant={i % 2 === 0 ? 'pink' : 'green'}>
                        <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: RC.textDark }}>{r.location}</p>
                                <div style={{ display: 'flex', gap: '14px', marginTop: '5px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', color: RC.textMid }}>
                                        🩸 <strong style={{ color: RC.crimson }}>{r.quantity}</strong> units of <strong>{r.bloodGroup}</strong>
                                    </span>
                                    {r.distanceKm != null && (
                                        <span style={{ fontSize: '13px', color: RC.greenDark, fontWeight: 600 }}>📍 {r.distanceKm} km</span>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => onSelectBank(r, bg, qty)}
                                style={{
                                    padding: '9px 18px', borderRadius: '10px', fontWeight: 900, fontSize: '13px',
                                    backgroundColor: RC.crimson, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
                                }}
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

// ── Request Tab ───────────────────────────────────────────────────────────────
function RequestTab({ selectedBank, prefillBG, prefillQty, onToast, onTabChange }) {
    const [form, setForm] = useState({
        patientName: '', patientAge: '', wardBed: '', attendingPhysician: '',
        bloodGroup: prefillBG || '', componentType: '', quantity: prefillQty || 1,
        urgency: 'NORMAL', notes: '',
    });
    const [receipt, setReceipt] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => { if (prefillBG) setForm(f => ({ ...f, bloodGroup: prefillBG, quantity: prefillQty || 1 })); }, [prefillBG, prefillQty]);

    const validate = () => {
        const e = {};
        if (!form.patientName.trim() || form.patientName.trim().length < 2) e.patientName = 'Required (min 2 chars).';
        if (!form.bloodGroup) e.bloodGroup = 'Please select a blood group.';
        if (form.quantity < 1 || form.quantity > 50) e.quantity = 'Must be 1–50.';
        if (!selectedBank) e.bloodBank = 'Search for blood and select a blood bank first.';
        if (!receipt) e.receipt = 'Hospital receipt or prescription is required.';
        return e;
    };

    const submit = async () => {
        const e = validate(); setErrors(e);
        if (Object.keys(e).length) return;
        setLoading(true);
        try {
            await apiFetch('/requests', {
                method: 'POST', body: JSON.stringify({
                    patientName: form.patientName.trim(),
                    patientAge: form.patientAge ? +form.patientAge : null,
                    wardBed: form.wardBed.trim() || null,
                    attendingPhysician: form.attendingPhysician.trim() || null,
                    bloodGroup: form.bloodGroup, componentType: form.componentType || null,
                    quantity: +form.quantity, urgency: form.urgency,
                    notes: form.notes.trim() || null, bloodBankId: selectedBank.id,
                    receiptData: receipt?.data || null, receiptFileName: receipt?.name || null,
                    receiptMimeType: receipt?.mime || null,
                })
            });
            onToast('🩸 Blood request submitted! The blood bank will respond shortly.');
            setForm({
                patientName: '', patientAge: '', wardBed: '', attendingPhysician: '',
                bloodGroup: prefillBG || '', componentType: '', quantity: 1, urgency: 'NORMAL', notes: ''
            });
            setReceipt(null); setErrors({});
            onTabChange('tracking');
        } catch (ex) { onToast('❌ ' + ex.message, 'error'); }
        finally { setLoading(false); }
    };

    const F = ({ label, err, required, children }) => (
        <div>
            <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '5px', color: RC.textMid }}>
                {label} {required && <span style={{ color: RC.crimson }}>*</span>}
            </label>
            {children}
            {err && <p style={{ margin: '3px 0 0', fontSize: '11px', color: RC.crimson, fontWeight: 600 }}>⚠ {err}</p>}
        </div>
    );

    return (
        <div style={{ maxWidth: '600px' }}>
            {selectedBank ? (
                <RCCard variant="green" style={{ padding: '12px 16px', marginBottom: '18px' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: RC.greenDark }}>
                        ✅ Selected: <strong>{selectedBank.location}</strong>
                        {selectedBank.distanceKm != null && <span style={{ fontWeight: 400 }}> · {selectedBank.distanceKm} km</span>}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: RC.textMuted }}>
                        {selectedBank.quantity} units of {selectedBank.bloodGroup} available
                    </p>
                </RCCard>
            ) : (
                <RCCard variant="pink" style={{ padding: '14px 16px', marginBottom: '18px', border: `2px solid ${RC.crimson}` }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: RC.crimson }}>⚠ No blood bank selected</p>
                    <p style={{ margin: '4px 0 8px', fontSize: '12px', color: RC.textMid }}>
                        Go to <strong>"Find Blood"</strong> tab, search and click <strong>"Select & Request"</strong>.
                    </p>
                    <button onClick={() => onTabChange('search')} style={{
                        padding: '6px 14px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 700, backgroundColor: RC.crimson, color: '#fff', border: 'none', cursor: 'pointer'
                    }}>
                        → Find Blood
                    </button>
                </RCCard>
            )}

            {form.urgency === 'CRITICAL' && (
                <div className="pulse-urgent" style={{
                    marginBottom: '16px', padding: '12px 16px', borderRadius: '12px',
                    backgroundColor: '#FDE8F0', border: `2px solid ${RC.crimson}`
                }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '13px', color: RC.crimson }}>
                        🚨 CRITICAL REQUEST — Flagged for immediate priority. Blood bank and admin will be alerted.
                    </p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <F label="Patient Full Name" required err={errors.patientName}>
                    <input value={form.patientName} onChange={e => { setForm(f => ({ ...f, patientName: e.target.value })); setErrors(er => ({ ...er, patientName: '' })); }}
                        placeholder="Full name of patient" style={SI(errors.patientName)} />
                </F>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <F label="Age">
                        <input type="number" min="0" max="120" value={form.patientAge}
                            onChange={e => setForm(f => ({ ...f, patientAge: e.target.value }))} placeholder="Years" style={SI(false)} />
                    </F>
                    <F label="Ward / Bed">
                        <input value={form.wardBed} onChange={e => setForm(f => ({ ...f, wardBed: e.target.value }))}
                            placeholder="e.g. ICU-4" style={SI(false)} />
                    </F>
                    <F label="Attending Physician">
                        <input value={form.attendingPhysician} onChange={e => setForm(f => ({ ...f, attendingPhysician: e.target.value }))}
                            placeholder="Dr. Name" style={SI(false)} />
                    </F>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <F label="Blood Group" required err={errors.bloodGroup}>
                        <select value={form.bloodGroup} onChange={e => { setForm(f => ({ ...f, bloodGroup: e.target.value })); setErrors(er => ({ ...er, bloodGroup: '' })); }}
                            style={SI(errors.bloodGroup)}>
                            <option value="">Select</option>
                            {BG.map(g => <option key={g}>{g}</option>)}
                        </select>
                    </F>
                    <F label="Component">
                        <select value={form.componentType} onChange={e => setForm(f => ({ ...f, componentType: e.target.value }))} style={SI(false)}>
                            <option value="">Any / Whole Blood</option>
                            {COMPONENTS.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </F>
                    <F label="Quantity (units)" required err={errors.quantity}>
                        <input type="number" min="1" max="50" value={form.quantity}
                            onChange={e => { setForm(f => ({ ...f, quantity: +e.target.value || 1 })); setErrors(er => ({ ...er, quantity: '' })); }}
                            style={SI(errors.quantity)} />
                    </F>
                </div>

                <F label="Urgency Level" required>
                    <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
                        style={{ ...SI(false), borderColor: form.urgency === 'CRITICAL' ? RC.crimson : form.urgency === 'URGENT' ? '#E65100' : '#E0E0E0' }}>
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">⚡ Urgent</option>
                        <option value="CRITICAL">🚨 Critical / Emergency</option>
                    </select>
                </F>

                <F label="Additional Notes">
                    <textarea value={form.notes} rows={2} placeholder="Special instructions, clinical notes…"
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        style={{ ...SI(false), resize: 'none' }} />
                </F>

                <div>
                    <ReceiptUpload value={receipt} onChange={setReceipt} />
                    {errors.receipt && <p style={{ margin: '4px 0 0', fontSize: '11px', color: RC.crimson, fontWeight: 600 }}>⚠ {errors.receipt}</p>}
                </div>

                {errors.bloodBank && (
                    <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: RC.pinkBg, border: `1.5px solid ${RC.crimson}` }}>
                        <p style={{ margin: 0, fontSize: '12px', color: RC.crimson, fontWeight: 700 }}>⚠ {errors.bloodBank}</p>
                    </div>
                )}

                <button onClick={submit} disabled={loading} style={{
                    width: '100%', padding: '13px', borderRadius: '12px',
                    fontWeight: 900, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    backgroundColor: form.urgency === 'CRITICAL' || form.urgency === 'URGENT' ? RC.crimson : RC.greenDark,
                    color: '#fff', opacity: loading ? 0.7 : 1
                }}>
                    {loading ? '⏳ Submitting…' : form.urgency === 'CRITICAL' ? '🚨 Submit Critical Request'
                        : form.urgency === 'URGENT' ? '⚡ Submit Urgent Request' : '🩸 Submit Blood Request'}
                </button>
            </div>
        </div>
    );
}

// ── Tracking Tab ──────────────────────────────────────────────────────────────
function TrackingTab({ onToast }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCanc] = useState(null);

    const load = useCallback(async () => {
        try { setData(await apiFetch('/requests/my') || []); }
        catch { setData([]); } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        load();
        const iv = setInterval(load, 6000);
        const vis = () => { if (document.hidden) clearInterval(iv); };
        document.addEventListener('visibilitychange', vis);
        return () => { clearInterval(iv); document.removeEventListener('visibilitychange', vis); };
    }, [load]);

    const cancel = async id => {
        if (!window.confirm('Cancel this blood request?')) return;
        setCanc(id);
        try { await apiFetch(`/requests/${id}/cancel`, { method: 'PUT' }); onToast('Request cancelled.'); load(); }
        catch (e) { onToast('❌ ' + e.message, 'error'); } finally { setCanc(null); }
    };

    const urgent = data.filter(r => r.urgency !== 'NORMAL').length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: RC.textMuted }}>⟳ Auto-refreshes every 6 seconds</p>
                <button onClick={load} style={{
                    padding: '5px 14px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: 700, backgroundColor: RC.greenLight, color: RC.greenDark,
                    border: `1px solid ${RC.greenMid}`, cursor: 'pointer'
                }}>↻ Refresh</button>
            </div>

            {urgent > 0 && (
                <div className="pulse-urgent" style={{
                    marginBottom: '14px', padding: '12px 16px', borderRadius: '12px',
                    backgroundColor: '#FDE8F0', border: `2px solid ${RC.crimson}`
                }}>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '13px', color: RC.crimson }}>
                        🚨 {urgent} urgent/critical request{urgent > 1 ? 's' : ''} active
                    </p>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: RC.textMuted }}>⏳ Loading…</div>
            ) : data.length === 0 ? (
                <RCCard variant="green" style={{ padding: '50px', textAlign: 'center' }}>
                    <p style={{ fontSize: '36px', margin: '0 0 10px' }}>✅</p>
                    <p style={{ fontWeight: 700, color: RC.greenDark, margin: 0 }}>No active requests</p>
                </RCCard>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[...data].sort((a, b) => (b.urgency === 'CRITICAL') - (a.urgency === 'CRITICAL') || (b.urgency === 'URGENT') - (a.urgency === 'URGENT'))
                        .map(r => (
                            <RCCard key={r.id} variant={r.urgency !== 'NORMAL' ? 'pink' : 'white'}
                                style={r.urgency !== 'NORMAL' ? { border: `2px solid ${RC.crimson}` } : {}}>
                                <div style={{ padding: '16px' }}>
                                    {r.urgency !== 'NORMAL' && (
                                        <p style={{
                                            margin: '0 0 8px', fontSize: '11px', fontWeight: 900, color: RC.crimson,
                                            textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}>
                                            {r.urgency === 'CRITICAL' ? '🚨 Critical Emergency' : '⚡ Urgent Request'}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 900, fontSize: '17px', color: RC.crimson }}>
                                                {r.bloodGroup} · {r.quantity} unit{r.quantity > 1 ? 's' : ''}
                                                {r.componentType && <span style={{ fontSize: '13px', fontWeight: 400, color: RC.textMid }}> ({r.componentType})</span>}
                                            </p>
                                            <p style={{ margin: '3px 0 0', fontSize: '13px', color: RC.textMid }}>Patient: <strong>{r.patientName}</strong>
                                                {r.patientAge && <span> · Age {r.patientAge}</span>}
                                                {r.wardBed && <span> · {r.wardBed}</span>}
                                            </p>
                                            {r.bloodBankName && <p style={{ margin: '2px 0 0', fontSize: '12px', color: RC.textMuted }}>🏥 Bank: {r.bloodBankName}</p>}
                                            {r.riderName && <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 700, color: RC.greenDark }}>🏍 Rider: {r.riderName}</p>}
                                            {(r.status === 'ASSIGNED' || r.status === 'IN_TRANSIT') && r.deliveryOtp && (
                                                <div style={{
                                                    marginTop: '8px', padding: '8px 12px', borderRadius: '9px', display: 'inline-block',
                                                    backgroundColor: RC.cardYellow, border: '1.5px solid #FFD54F'
                                                }}>
                                                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#E65100' }}>
                                                        🔐 Delivery OTP: <span style={{ fontSize: '20px', letterSpacing: '4px', fontFamily: 'monospace' }}>{r.deliveryOtp}</span>
                                                    </p>
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#E65100' }}>Share this with the rider on delivery</p>
                                                </div>
                                            )}
                                            {r.rejectionReason && (
                                                <p style={{ margin: '6px 0 0', fontSize: '12px', color: RC.crimson, fontStyle: 'italic' }}>
                                                    Reason: {r.rejectionReason}
                                                </p>
                                            )}
                                        </div>
                                        <Badge status={r.status} />
                                    </div>
                                    {STEPS.includes(r.status) && <ProgressTracker status={r.status} />}
                                    {r.status === 'PENDING' && (
                                        <button onClick={() => cancel(r.id)} disabled={cancelling === r.id}
                                            style={{
                                                marginTop: '12px', padding: '6px 14px', borderRadius: '8px', fontSize: '12px',
                                                fontWeight: 700, backgroundColor: '#FDE8F0', color: RC.crimson,
                                                border: `1.5px solid ${RC.crimsonLight}`, cursor: 'pointer'
                                            }}>
                                            {cancelling === r.id ? 'Cancelling…' : '✕ Cancel Request'}
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

// ── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        apiFetch('/requests/my/history').then(d => setHistory(d || [])).catch(() => setHistory([])).finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'ALL' ? history : history.filter(r => r.status === filter);
    const stats = [
        { label: 'Total', value: history.length, bg: RC.cardBlue, c: '#1565C0', bd: '#90CAF9' },
        { label: 'Delivered', value: history.filter(r => r.status === 'DELIVERED').length, bg: RC.greenLight, c: RC.greenDark, bd: RC.greenMid },
        { label: 'Rejected', value: history.filter(r => r.status === 'REJECTED').length, bg: RC.pinkBg, c: RC.crimson, bd: RC.crimsonLight },
        { label: 'Emergency Handled', value: history.filter(r => r.urgency !== 'NORMAL').length, bg: RC.cardYellow, c: '#E65100', bd: '#FFD54F' },
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '18px' }}>
                {stats.map(s => (
                    <div key={s.label} style={{
                        borderRadius: '12px', padding: '14px', textAlign: 'center',
                        backgroundColor: s.bg, border: `1.5px solid ${s.bd}`
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: s.c }}>{s.value}</div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: RC.textMid, marginTop: '3px' }}>{s.label}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {['ALL', 'DELIVERED', 'REJECTED', 'CANCELLED'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                            border: '1.5px solid', cursor: 'pointer',
                            backgroundColor: filter === f ? RC.crimson : '#fff', color: filter === f ? '#fff' : RC.crimson,
                            borderColor: filter === f ? RC.crimsonDark : RC.crimsonLight
                        }}>{f}</button>
                ))}
            </div>
            {loading ? <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>Loading…</div>
                : filtered.length === 0 ? <RCCard variant="green" style={{ padding: '30px', textAlign: 'center' }}><p style={{ color: RC.greenDark, fontWeight: 600, margin: 0 }}>No records found.</p></RCCard>
                    : (
                        <RCCard variant="white" style={{ overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}>
                                        {['#', 'Patient', 'Blood', 'Qty', 'Component', 'Bank', 'Urgency', 'Status'].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '9px 13px', fontSize: '11px', fontWeight: 900, color: RC.crimson }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((r, i) => (
                                        <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : RC.pinkSoft, borderBottom: '1px solid #F5E0E8' }}>
                                            <td style={{ padding: '9px 13px', color: RC.textMuted, fontSize: '11px' }}>#{r.id}</td>
                                            <td style={{ padding: '9px 13px', fontWeight: 600, color: RC.textDark }}>{r.patientName}</td>
                                            <td style={{ padding: '9px 13px', fontWeight: 900, color: RC.crimson }}>{r.bloodGroup}</td>
                                            <td style={{ padding: '9px 13px', color: RC.textMid }}>{r.quantity}</td>
                                            <td style={{ padding: '9px 13px', color: RC.textMuted }}>{r.componentType || '—'}</td>
                                            <td style={{ padding: '9px 13px', color: RC.textMid, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.bloodBankName || '—'}</td>
                                            <td style={{ padding: '9px 13px' }}><UrgencyBadge urgency={r.urgency} /></td>
                                            <td style={{ padding: '9px 13px' }}><Badge status={r.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </RCCard>
                    )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HospitalDashboard({ onLogout }) {
    const [tab, setTab] = useState('search');
    const [selBank, setSelBank] = useState(null);
    const [prefBG, setPrefBG] = useState('');
    const [prefQty, setPrefQty] = useState(1);
    const [toast, setToast] = useState(null);
    const entityName = localStorage.getItem('entityName') || 'Hospital';
    const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

    return (
        <div className="dashboard-shell">
            {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
            <RCSidebar role="HOSPITAL" entityName={entityName} tabs={TABS} activeTab={tab} onTabChange={setTab} onLogout={onLogout} />
            <div className="dashboard-main">
                <div style={{ backgroundColor: '#fff', borderBottom: `2px solid ${RC.pinkSoft}`, padding: '16px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h2 style={{ margin: 0, fontWeight: 900, fontSize: '17px', color: RC.crimson }}>
                        {TABS.find(t => t.key === tab)?.icon} {TABS.find(t => t.key === tab)?.label}
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: RC.textMuted }}>RC Foundation — Blood Management System</p>
                </div>
                <main className="dashboard-content">
                    {tab === 'search' && <SearchTab onSelectBank={(bank, bg, qty) => { setSelBank(bank); setPrefBG(bg); setPrefQty(qty); setTab('request'); }} />}
                    {tab === 'request' && <RequestTab selectedBank={selBank} prefillBG={prefBG} prefillQty={prefQty} onToast={showToast} onTabChange={setTab} />}
                    {tab === 'tracking' && <TrackingTab onToast={showToast} />}
                    {tab === 'history' && <HistoryTab />}
                </main>
            </div>
        </div>
    );
}
