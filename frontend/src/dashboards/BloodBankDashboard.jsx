import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/api';
import RCSidebar from '../components/RCSidebar';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC, STATUS_CONFIG } from '../components/RCTheme';

const BG_LIST     = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COMPONENTS  = ['Whole Blood','PCV','FFP','SDP','Platelets'];
const URGENCY_CFG = {
  CRITICAL: { bg: RC.crimson,    color: '#fff',          label: '🚨 CRITICAL' },
  URGENT:   { bg: RC.pinkBg,     color: RC.crimson,      label: '⚡ URGENT'   },
  NORMAL:   { bg: '#F5F5F5',     color: RC.textMuted,    label: 'Normal'      },
};

const TABS = [
  { key: 'requests',  icon: '📥', label: 'Requests'  },
  { key: 'inventory', icon: '🧪', label: 'Inventory' },
  { key: 'donors',    icon: '👥', label: 'Donors'    },
  { key: 'camps',     icon: '🏕',  label: 'Camps'     },
  { key: 'reports',   icon: '📊', label: 'Reports'   },
];

const SI = (err = false, extra = {}) => ({
  width: '100%', padding: '9px 12px', borderRadius: '9px', fontSize: '13px',
  color: RC.textDark, outline: 'none', boxSizing: 'border-box',
  border: `1.5px solid ${err ? RC.crimson : RC.border}`,
  backgroundColor: '#fff', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
  ...extra,
});

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { bg: '#F5F5F5', color: RC.textMuted, label: status };
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
      backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border || '#E0E0E0'}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  const cfg = URGENCY_CFG[urgency] || URGENCY_CFG.NORMAL;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
      backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
      <div>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '18px', color: RC.textDark }}>{title}</h3>
        {subtitle && <p style={{ margin: '3px 0 0', fontSize: '12px', color: RC.textMuted }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Requests Tab ─────────────────────────────────────────────────────────── */
function RequestsTab({ onToast }) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason,       setRejectReason]       = useState('');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [riders,   setRiders]   = useState([]);
  const [assignId, setAssignId] = useState(null);
  const [riderId,  setRiderId]  = useState('');
  const [filter,   setFilter]   = useState('PENDING');

  const load = useCallback(async () => {
    try { setRequests(await apiFetch('/requests/bank') || []); }
    catch { setRequests([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const accept = async (id) => {
    setActionId(id);
    try { await apiFetch(`/requests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'ACCEPTED' }) }); onToast('✅ Request accepted.'); load(); }
    catch (e) { onToast('❌ ' + e.message, 'error'); } finally { setActionId(null); }
  };

  const reject = async () => {
    const effectiveReason = rejectReason === 'Other' ? customRejectReason.trim() : rejectReason.trim();
    if (!effectiveReason) { onToast('Please provide a rejection reason.', 'error'); return; }
    setActionId(rejectId);
    try {
      await apiFetch(`/requests/${rejectId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'REJECTED', reason: effectiveReason }) });
      onToast('Request rejected.'); setRejectId(null); setRejectReason(''); setCustomRejectReason(''); load();
    } catch (e) { onToast('❌ ' + e.message, 'error'); } finally { setActionId(null); }
  };

  const openAssign = async (id) => {
    setAssignId(id); setRiderId('');
    try { setRiders(await apiFetch('/users/riders') || []); } catch { setRiders([]); }
  };

  const assign = async () => {
    if (!riderId) { onToast('Please select a rider.', 'error'); return; }
    setActionId(assignId);
    try {
      await apiFetch(`/requests/${assignId}/assign-rider`, { method: 'PUT', body: JSON.stringify({ riderId: +riderId }) });
      onToast('🏍 Rider assigned!'); setAssignId(null); setRiderId(''); load();
    } catch (e) { onToast('❌ ' + e.message, 'error'); } finally { setActionId(null); }
  };

  const FILTERS = ['PENDING','ACCEPTED','ASSIGNED','IN_TRANSIT','DELIVERED','REJECTED'];
  const counts  = Object.fromEntries(FILTERS.map(f => [f, requests.filter(r => r.status === f).length]));
  const visible = requests.filter(r => filter === 'ALL' || r.status === filter);

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {FILTERS.map(f => {
          const cfg = STATUS_CONFIG[f] || {};
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
              border: `1.5px solid ${active ? RC.crimson : RC.border}`,
              backgroundColor: active ? RC.crimson : '#fff',
              color: active ? '#fff' : RC.textMid,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              {f.replace('_', ' ')}
              {counts[f] > 0 && (
                <span style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.3)' : cfg.bg || '#F5F5F5',
                  color: active ? '#fff' : cfg.color || RC.textMid,
                  borderRadius: '10px', padding: '0 6px', fontSize: '10px', fontWeight: 900,
                }}>
                  {counts[f]}
                </span>
              )}
            </button>
          );
        })}
        <button onClick={load} style={{
          marginLeft: 'auto', padding: '5px 14px', borderRadius: '20px', fontSize: '12px',
          fontWeight: 700, backgroundColor: RC.greenLight, color: RC.greenDark,
          border: `1.5px solid ${RC.greenMid}`, cursor: 'pointer',
        }}>↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: RC.textMuted }}>⏳ Loading…</div>
      ) : visible.length === 0 ? (
        <RCCard variant="green" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '36px', margin: '0 0 8px' }}>✅</p>
          <p style={{ fontWeight: 700, color: RC.greenDark, margin: 0 }}>No {filter.replace('_', ' ').toLowerCase()} requests</p>
        </RCCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[...visible]
            .sort((a, b) => {
              const w = { CRITICAL: 3, URGENT: 2, NORMAL: 1 };
              return (w[b.urgency] || 0) - (w[a.urgency] || 0) || new Date(b.createdAt) - new Date(a.createdAt);
            })
            .map(r => (
              <RCCard key={r.id} variant={r.urgency === 'CRITICAL' ? 'pink' : 'white'}
                style={r.urgency === 'CRITICAL' ? { border: `2px solid ${RC.crimson}` } : {}}>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 900, fontSize: '18px', color: RC.crimson }}>
                          {r.bloodGroup}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: RC.textDark }}>
                          · {r.quantity} unit{r.quantity > 1 ? 's' : ''}
                          {r.componentType && <span style={{ fontWeight: 400, fontSize: '13px', color: RC.textMuted }}> ({r.componentType})</span>}
                        </span>
                        <UrgencyBadge urgency={r.urgency} />
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: RC.textMid }}>
                        🏥 <strong>{r.hospitalName || 'Hospital'}</strong>
                        {r.patientName && <span style={{ color: RC.textMuted }}> · Patient: {r.patientName}</span>}
                        {r.patientAge  && <span style={{ color: RC.textMuted }}> · Age {r.patientAge}</span>}
                        {r.wardBed     && <span style={{ color: RC.textMuted }}> · {r.wardBed}</span>}
                      </p>
                      {r.notes && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: RC.textMuted, fontStyle: 'italic' }}>
                          📝 {r.notes}
                        </p>
                      )}
                      {r.riderName && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', fontWeight: 700, color: RC.greenDark }}>
                          🏍 Rider: {r.riderName}
                        </p>
                      )}
                      {r.rejectionReason && (
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: RC.crimson, fontStyle: 'italic' }}>
                          Reason: {r.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                      <StatusBadge status={r.status} />
                      <span style={{ fontSize: '11px', color: RC.textMuted }}>
                        #{r.id} · {new Date(r.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {r.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => accept(r.id)} disabled={actionId === r.id}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '9px', fontWeight: 700, fontSize: '13px',
                          backgroundColor: RC.greenDark, color: '#fff', border: 'none',
                          cursor: actionId === r.id ? 'not-allowed' : 'pointer', opacity: actionId === r.id ? 0.6 : 1,
                          transition: 'opacity 0.15s',
                        }}>
                        {actionId === r.id ? '⏳ Processing…' : '✅ Accept'}
                      </button>
                      <button onClick={() => { setRejectId(r.id); setRejectReason(''); setCustomRejectReason(''); }}
                        disabled={actionId === r.id}
                        style={{
                          flex: 1, padding: '8px', borderRadius: '9px', fontWeight: 700, fontSize: '13px',
                          backgroundColor: RC.pinkBg, color: RC.crimson,
                          border: `1.5px solid ${RC.crimsonLight}`, cursor: 'pointer',
                        }}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <button onClick={() => openAssign(r.id)}
                      style={{
                        marginTop: '10px', width: '100%', padding: '8px', borderRadius: '9px',
                        fontWeight: 700, fontSize: '13px', backgroundColor: '#EDE7F6', color: '#512DA8',
                        border: '1.5px solid #B39DDB', cursor: 'pointer',
                      }}>
                      🏍 Assign Rider
                    </button>
                  )}
                </div>
              </RCCard>
            ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <Modal title="Reject Request" onClose={() => { setRejectId(null); setRejectReason(''); setCustomRejectReason(''); }}>
          <p style={{ fontSize: '13px', color: RC.textMid, marginBottom: '14px' }}>
            Please select a reason so the hospital can be informed and find an alternative.
          </p>
          <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>
            Reason for rejection
          </label>
          <select value={rejectReason} onChange={e => { setRejectReason(e.target.value); setCustomRejectReason(''); }}
            style={{ ...SI(false), marginBottom: '10px' }}>
            <option value="">Select a reason…</option>
            <option value="Insufficient stock">Insufficient stock</option>
            <option value="Requested blood group not available">Blood group not available</option>
            <option value="Component type not available">Component type not available</option>
            <option value="Blood bank at capacity">Blood bank at capacity</option>
            <option value="Invalid request details">Invalid request details</option>
            <option value="Other">Other (specify below)</option>
          </select>
          {rejectReason === 'Other' && (
            <textarea
              rows={3}
              placeholder="Describe the reason…"
              value={customRejectReason}
              onChange={e => setCustomRejectReason(e.target.value)}
              style={{ ...SI(false), resize: 'none', marginBottom: '12px' }}
            />
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setRejectId(null); setRejectReason(''); setCustomRejectReason(''); }}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', backgroundColor: '#F5F5F5', color: RC.textMid, border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={reject}
              disabled={!(rejectReason === 'Other' ? customRejectReason.trim() : rejectReason.trim()) || actionId === rejectId}
              style={{
                flex: 1, padding: '9px', borderRadius: '9px', fontWeight: 700, fontSize: '13px',
                backgroundColor: RC.crimson, color: '#fff', border: 'none',
                cursor: !(rejectReason === 'Other' ? customRejectReason.trim() : rejectReason.trim()) ? 'not-allowed' : 'pointer',
                opacity: !(rejectReason === 'Other' ? customRejectReason.trim() : rejectReason.trim()) ? 0.5 : 1,
              }}>
              {actionId === rejectId ? '⏳ Rejecting…' : 'Confirm Reject'}
            </button>
          </div>
        </Modal>
      )}

      {/* Assign Rider Modal */}
      {assignId && (
        <Modal title="Assign Rider" onClose={() => { setAssignId(null); setRiderId(''); }}>
          <p style={{ fontSize: '13px', color: RC.textMid, marginBottom: '14px' }}>
            Select an available rider to pick up and deliver this blood request.
          </p>
          {riders.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: RC.textMuted, backgroundColor: '#F9F9F9', borderRadius: '10px', marginBottom: '14px' }}>
              No available riders right now.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {riders.map(r => (
                <label key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  borderRadius: '10px', cursor: r.available ? 'pointer' : 'default',
                  border: `1.5px solid ${riderId == r.id ? RC.crimson : RC.border}`,
                  backgroundColor: riderId == r.id ? RC.pinkBg : r.available ? '#fff' : '#F9F9F9',
                  opacity: r.available ? 1 : 0.5,
                }}>
                  <input type="radio" name="rider" value={r.id} checked={riderId == r.id}
                    onChange={() => r.available && setRiderId(String(r.id))}
                    disabled={!r.available}
                    style={{ accentColor: RC.crimson }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: RC.textDark }}>
                      {r.name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: RC.textMuted }}>
                      {r.vehicleType || 'Vehicle'} · {r.assignedZone || 'No zone'}
                      {r.activeTasks > 0 && ` · ${r.activeTasks} active task(s)`}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                    backgroundColor: r.available ? RC.greenLight : '#F5F5F5',
                    color: r.available ? RC.greenDark : RC.textMuted,
                    border: `1px solid ${r.available ? RC.greenMid : '#E0E0E0'}`,
                  }}>
                    {r.available ? '🟢 Free' : '🔴 Busy'}
                  </span>
                </label>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setAssignId(null); setRiderId(''); }}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', backgroundColor: '#F5F5F5', color: RC.textMid, border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={assign} disabled={!riderId || actionId === assignId}
              style={{
                flex: 1, padding: '9px', borderRadius: '9px', fontWeight: 700, fontSize: '13px',
                backgroundColor: riderId ? '#512DA8' : '#C0C0C0', color: '#fff', border: 'none',
                cursor: riderId ? 'pointer' : 'not-allowed',
              }}>
              {actionId === assignId ? '⏳ Assigning…' : '🏍 Assign'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Inventory Tab ────────────────────────────────────────────────────────── */
function InventoryTab({ onToast }) {
  const [inv,     setInv]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ bloodGroup: '', category: 'Whole Blood', quantity: '', collectionDate: '', expiryDate: '', unitId: '', volumeMl: '', lowStockThreshold: 5 });
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try { setInv(await apiFetch('/inventory/my') || []); }
    catch { setInv([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.bloodGroup || !form.quantity) { onToast('Blood group and quantity are required.', 'error'); return; }
    setSaving(true);
    try {
      const body = {
        bloodGroup:        form.bloodGroup,
        category:          form.category || null,
        quantity:          +form.quantity,
        collectionDate:    form.collectionDate || null,
        expiryDate:        form.expiryDate     || null,
        unitId:            form.unitId         || null,
        volumeMl:          form.volumeMl ? +form.volumeMl : null,
        lowStockThreshold: form.lowStockThreshold ? +form.lowStockThreshold : 5,
      };
      if (editId) {
        await apiFetch(`/inventory/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
        onToast('✅ Inventory updated.');
      } else {
        await apiFetch('/inventory', { method: 'POST', body: JSON.stringify(body) });
        onToast('✅ Blood unit added.');
      }
      setForm({ bloodGroup: '', category: 'Whole Blood', quantity: '', collectionDate: '', expiryDate: '', unitId: '', volumeMl: '', lowStockThreshold: 5 });
      setEditId(null); setShowAdd(false); load();
    } catch (e) { onToast('❌ ' + e.message, 'error'); } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this inventory record?')) return;
    try { await apiFetch(`/inventory/${id}`, { method: 'DELETE' }); onToast('Deleted.'); load(); }
    catch (e) { onToast('❌ ' + e.message, 'error'); }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      bloodGroup: item.bloodGroup || '', category: item.category || 'Whole Blood',
      quantity: item.quantity ?? '', collectionDate: item.collectionDate || '',
      expiryDate: item.expiryDate || '', unitId: item.unitId || '',
      volumeMl: item.volumeMl || '', lowStockThreshold: item.lowStockThreshold || 5,
    });
    setShowAdd(true);
  };

  // Aggregate totals per blood group
  const totals = BG_LIST.map(bg => ({
    bg,
    qty: inv.filter(i => i.bloodGroup === bg).reduce((s, i) => s + (i.quantity || 0), 0),
  }));

  const isExpiring = (d) => { if (!d) return false; const diff = (new Date(d) - Date.now()) / 86400000; return diff >= 0 && diff <= 7; };
  const isExpired  = (d) => d && new Date(d) < new Date();

  return (
    <div>
      {/* Stock overview grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
        {totals.map(({ bg, qty }) => (
          <div key={bg} style={{
            borderRadius: '12px', padding: '14px 12px', textAlign: 'center',
            backgroundColor: qty > 0 ? RC.greenLight : RC.pinkBg,
            border: `1.5px solid ${qty > 0 ? RC.greenMid : RC.crimsonLight}`,
          }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: qty > 0 ? RC.greenDark : RC.crimson }}>{qty}</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: RC.textDark }}>{bg}</div>
            <div style={{ fontSize: '10px', color: RC.textMuted, marginTop: '2px' }}>units</div>
          </div>
        ))}
      </div>

      <SectionHeader
        title="Inventory Records"
        subtitle={`${inv.length} record${inv.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setShowAdd(true); setEditId(null); setForm({ bloodGroup:'', category:'Whole Blood', quantity:'', collectionDate:'', expiryDate:'', unitId:'', volumeMl:'', lowStockThreshold:5 }); }}
            style={{ padding: '8px 18px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', backgroundColor: RC.crimson, color: '#fff', border: 'none', cursor: 'pointer' }}>
            + Add Units
          </button>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>⏳ Loading…</div>
      ) : inv.length === 0 ? (
        <RCCard variant="pink" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🧪</p>
          <p style={{ fontWeight: 700, color: RC.crimson, margin: 0 }}>No inventory yet. Add blood units to get started.</p>
        </RCCard>
      ) : (
        <RCCard variant="white" style={{ overflow: 'hidden' }}>
          <table className="rc-table">
            <thead>
              <tr>
                {['Unit ID', 'Group', 'Component', 'Qty', 'Collected', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.map(item => {
                const expired  = isExpired(item.expiryDate);
                const expiring = !expired && isExpiring(item.expiryDate);
                return (
                  <tr key={item.id}>
                    <td style={{ fontSize: '11px', color: RC.textMuted, fontFamily: 'monospace' }}>{item.unitId || `#${item.id}`}</td>
                    <td><strong style={{ color: RC.crimson }}>{item.bloodGroup}</strong></td>
                    <td style={{ color: RC.textMid }}>{item.category || '—'}</td>
                    <td><strong>{item.quantity}</strong></td>
                    <td style={{ color: RC.textMuted, fontSize: '12px' }}>{item.collectionDate || '—'}</td>
                    <td style={{ color: expired ? RC.crimson : expiring ? '#E65100' : RC.textMuted, fontWeight: (expired || expiring) ? 700 : 400, fontSize: '12px' }}>
                      {item.expiryDate || '—'}
                      {expiring && <span style={{ marginLeft: '4px', fontSize: '10px' }}>⚠ Soon</span>}
                      {expired  && <span style={{ marginLeft: '4px', fontSize: '10px' }}>🚫 Expired</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                        backgroundColor: expired ? RC.pinkBg : item.quantity <= (item.lowStockThreshold || 5) && item.quantity > 0 ? RC.cardYellow : RC.greenLight,
                        color: expired ? RC.crimson : item.quantity <= (item.lowStockThreshold || 5) && item.quantity > 0 ? '#E65100' : RC.greenDark,
                      }}>
                        {expired ? 'Expired' : item.quantity === 0 ? 'Empty' : item.quantity <= (item.lowStockThreshold || 5) ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => startEdit(item)}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: '#EDE7F6', color: '#512DA8', border: 'none', cursor: 'pointer' }}>
                          Edit
                        </button>
                        <button onClick={() => del(item.id)}
                          style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: RC.pinkBg, color: RC.crimson, border: 'none', cursor: 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </RCCard>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <Modal title={editId ? 'Edit Inventory Record' : 'Add Blood Units'}
          onClose={() => { setShowAdd(false); setEditId(null); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Blood Group *</label>
              <select value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))} style={SI(!form.bloodGroup)}>
                <option value="">Select</option>
                {BG_LIST.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Component *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={SI(false)}>
                {COMPONENTS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Quantity *</label>
              <input type="number" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="Units" style={SI(!form.quantity)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Volume (ml)</label>
              <input type="number" min="1" value={form.volumeMl} onChange={e => setForm(f => ({ ...f, volumeMl: e.target.value }))} placeholder="e.g. 350" style={SI(false)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Collection Date</label>
              <input type="date" value={form.collectionDate} onChange={e => setForm(f => ({ ...f, collectionDate: e.target.value }))} style={SI(false)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} style={SI(false)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Unit ID / Barcode</label>
              <input value={form.unitId} onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))} placeholder="Optional" style={SI(false)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, display: 'block', marginBottom: '5px' }}>Low Stock Alert Threshold</label>
              <input type="number" min="1" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: e.target.value }))} style={SI(false)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setShowAdd(false); setEditId(null); }}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', backgroundColor: '#F5F5F5', color: RC.textMid, border: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              style={{ flex: 1, padding: '9px', borderRadius: '9px', fontWeight: 700, fontSize: '13px', backgroundColor: RC.crimson, color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? '⏳ Saving…' : editId ? 'Update' : 'Add Units'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Donors Tab ───────────────────────────────────────────────────────────── */
function DonorsTab({ onToast }) {
  const [donors,  setDonors]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    apiFetch('/donors/my').then(d => setDonors(d || [])).catch(() => setDonors([])).finally(() => setLoading(false));
  }, []);

  const filtered = donors.filter(d =>
    !search || d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.bloodGroup?.includes(search) || d.phone?.includes(search)
  );

  return (
    <div>
      <SectionHeader title="Donor Registry" subtitle={`${donors.length} registered donors`} />
      <div style={{ marginBottom: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name, blood group, or phone…"
          style={{ ...SI(false), maxWidth: '360px' }} />
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>⏳ Loading…</div>
      ) : filtered.length === 0 ? (
        <RCCard variant="green" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ fontWeight: 700, color: RC.greenDark, margin: 0 }}>
            {search ? 'No donors match your search.' : 'No donors registered yet.'}
          </p>
        </RCCard>
      ) : (
        <RCCard variant="white" style={{ overflow: 'hidden' }}>
          <table className="rc-table">
            <thead>
              <tr>{['Name','Blood Group','Phone','Last Donation','Donations','Eligible'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const eligible = !d.lastDonation || (Date.now() - new Date(d.lastDonation)) / 86400000 >= 56;
                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: RC.textDark }}>{d.name}</td>
                    <td><strong style={{ color: RC.crimson }}>{d.bloodGroup}</strong></td>
                    <td style={{ color: RC.textMid }}>{d.phone}</td>
                    <td style={{ fontSize: '12px', color: RC.textMuted }}>{d.lastDonation || '—'}</td>
                    <td style={{ fontWeight: 700, color: RC.textDark }}>{d.donationCount || 0}</td>
                    <td>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                        backgroundColor: eligible ? RC.greenLight : RC.pinkBg,
                        color: eligible ? RC.greenDark : RC.crimson,
                      }}>
                        {eligible ? '✅ Yes' : '⏳ Not yet'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </RCCard>
      )}
    </div>
  );
}

/* ── Camps Tab ────────────────────────────────────────────────────────────── */
function CampsTab({ onToast }) {
  const [camps,   setCamps]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/camps/my').then(d => setCamps(d || [])).catch(() => setCamps([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="Blood Donation Camps" subtitle={`${camps.length} camp${camps.length !== 1 ? 's' : ''} organised`} />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>⏳ Loading…</div>
      ) : camps.length === 0 ? (
        <RCCard variant="pink" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '36px', margin: '0 0 10px' }}>🏕</p>
          <p style={{ fontWeight: 700, color: RC.crimson, margin: 0 }}>No camps yet. Blood camps will appear here once created by admin.</p>
        </RCCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px' }}>
          {camps.map(c => (
            <RCCard key={c.id} variant="pink">
              <div style={{ padding: '16px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '15px', color: RC.crimson }}>{c.name}</p>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: RC.textMid }}>📍 {c.location}</p>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: RC.textMuted }}>📅 {c.date} {c.time}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: RC.greenDark, fontWeight: 700 }}>
                    🩸 {c.unitsCollected || 0} / {c.targetUnits || '?'} units
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                    backgroundColor: c.status === 'ACTIVE' ? RC.greenLight : '#F5F5F5',
                    color: c.status === 'ACTIVE' ? RC.greenDark : RC.textMuted,
                  }}>{c.status || 'Upcoming'}</span>
                </div>
              </div>
            </RCCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Reports Tab ──────────────────────────────────────────────────────────── */
function ReportsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/requests/bank/stats').then(d => setStats(d)).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: RC.textMuted }}>⏳ Loading reports…</div>;
  if (!stats)  return <RCCard variant="pink" style={{ padding: '32px', textAlign: 'center' }}><p style={{ color: RC.crimson, fontWeight: 700, margin: 0 }}>Reports not available.</p></RCCard>;

  const kpis = [
    { label: 'Total Requests',  value: stats.total       || 0, bg: RC.cardBlue,   c: '#1565C0', bd: '#90CAF9'    },
    { label: 'Fulfilled',       value: stats.delivered   || 0, bg: RC.greenLight, c: RC.greenDark, bd: RC.greenMid },
    { label: 'Rejected',        value: stats.rejected    || 0, bg: RC.pinkBg,     c: RC.crimson, bd: RC.crimsonLight },
    { label: 'Avg Response',    value: stats.avgMinutes ? `${stats.avgMinutes}m` : '—', bg: RC.cardYellow, c: '#E65100', bd: '#FFD54F' },
  ];

  return (
    <div>
      <SectionHeader title="Performance Reports" subtitle="Analytics for this blood bank" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ borderRadius: '14px', padding: '18px', textAlign: 'center', backgroundColor: k.bg, border: `1.5px solid ${k.bd}` }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: k.c }}>{k.value}</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>
      <RCCard variant="white" style={{ padding: '24px' }}>
        <p style={{ color: RC.textMuted, fontSize: '13px', textAlign: 'center', margin: 0 }}>
          Detailed charts and export features coming soon. Data exports available via the Admin panel.
        </p>
      </RCCard>
    </div>
  );
}

/* ── Modal Helper ─────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '18px', padding: '24px',
        width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        animation: 'fade-in-up 0.25s ease-out both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '17px', color: RC.textDark }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: RC.textMuted, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────────────────────── */
export default function BloodBankDashboard({ onLogout }) {
  const [tab,   setTab]   = useState('requests');
  const [toast, setToast] = useState(null);
  const entityName = localStorage.getItem('entityName') || 'Blood Bank';
  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  return (
    <div className="dashboard-shell">
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
      <RCSidebar role="BLOOD_BANK" entityName={entityName} tabs={TABS} activeTab={tab} onTabChange={setTab} onLogout={onLogout} />
      <div className="dashboard-main">
        <div style={{
          backgroundColor: '#fff', borderBottom: `2px solid ${RC.pinkSoft}`,
          padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '18px', color: RC.textDark }}>
              {TABS.find(t => t.key === tab)?.icon} {TABS.find(t => t.key === tab)?.label}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: RC.textMuted }}>RC Foundation — Blood Management System</p>
          </div>
        </div>
        <div className="dashboard-content">
          {tab === 'requests'  && <RequestsTab  onToast={showToast} />}
          {tab === 'inventory' && <InventoryTab onToast={showToast} />}
          {tab === 'donors'    && <DonorsTab    onToast={showToast} />}
          {tab === 'camps'     && <CampsTab     onToast={showToast} />}
          {tab === 'reports'   && <ReportsTab />}
        </div>
      </div>
    </div>
  );
}
