import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/api';
import RCCard from '../components/RCCard';
import RCSidebar from '../components/RCSidebar';
import { RC } from '../components/RCTheme';
import RCToast from '../components/RCToast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CATEGORIES = ['Whole Blood', 'PCV', 'FFP', 'SDP', 'Platelets'];

const TABS = [
    { key: 'requests', icon: '🩸', label: 'Requests' },
    { key: 'inventory', icon: '📦', label: 'Inventory' },
    { key: 'donors', icon: '👤', label: 'Donors' },
    { key: 'camps', icon: '🏕️', label: 'Camps' },
];

function PageHeader({ title }) {
    return (
        <div
            style={{
                backgroundColor: RC.pinkBg,
                borderBottom: `2px solid ${RC.crimsonLight}`,
                padding: '14px 28px',
            }}
        >
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '17px', color: RC.crimson }}>
                {title}
            </h2>
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        PENDING: { bg: RC.cardYellow, color: '#E65100' },
        ACCEPTED: { bg: RC.greenLight, color: RC.greenDark },
        REJECTED: { bg: RC.pinkBg, color: RC.crimson },
        CANCELLED: { bg: '#F5F5F5', color: '#888' },
        ASSIGNED: { bg: '#EDE7F6', color: '#512DA8' },
        IN_TRANSIT: { bg: RC.cardBlue, color: '#1565C0' },
        DELIVERED: { bg: RC.greenLight, color: RC.greenDark },
    };
    const s = map[status] || { bg: '#F5F5F5', color: RC.textMid };
    return (
        <span
            style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '20px',
                backgroundColor: s.bg,
                color: s.color,
                whiteSpace: 'nowrap',
            }}
        >
            {status?.replace('_', ' ')}
        </span>
    );
}

/* ── Receipt Viewer Modal ──────────────────────────────────────── */
function ReceiptModal({ request, onClose }) {
    if (!request?.receiptData) return null;
    const src = `data:${request.receiptMimeType};base64,${request.receiptData}`;
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.65)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '20px',
                    maxWidth: '680px',
                    width: '94vw',
                    maxHeight: '85vh',
                    overflow: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                    }}
                >
                    <p style={{ margin: 0, fontWeight: 900, color: RC.crimson, fontSize: '15px' }}>
                        📎 {request.receiptFileName || 'Receipt'} — {request.patientName}
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '22px',
                            cursor: 'pointer',
                            color: RC.textMid,
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
                {request.receiptMimeType === 'application/pdf' ? (
                    <embed
                        src={src}
                        type="application/pdf"
                        style={{ width: '100%', height: '480px', borderRadius: '8px' }}
                    />
                ) : (
                    <img
                        src={src}
                        alt="Receipt"
                        style={{ width: '100%', borderRadius: '8px', objectFit: 'contain' }}
                    />
                )}
                <a
                    href={src}
                    download={request.receiptFileName || 'receipt'}
                    style={{
                        display: 'block',
                        marginTop: '12px',
                        textAlign: 'center',
                        color: RC.crimson,
                        fontWeight: 700,
                        fontSize: '13px',
                        textDecoration: 'none',
                    }}
                >
                    ⬇ Download Receipt
                </a>
            </div>
        </div>
    );
}

/* ── Rider Assign Confirmation Modal ─────────────────────────── */
function AssignRiderModal({ request, riders, onConfirm, onClose }) {
    const [selectedRider, setSelected] = useState('');
    const [loading, setLoading] = useState(false);
    const available = riders.filter((r) => r.available);
    const busy = riders.filter((r) => !r.available);

    const handleConfirm = async () => {
        if (!selectedRider) {
            alert('Please select a rider first.');
            return;
        }
        const rider = riders.find((r) => r.id === +selectedRider);
        if (!rider) return;
        if (
            !window.confirm(
                `Assign "${rider.name}" to deliver ${request.bloodGroup} for patient ${request.patientName}?\n\n` +
                    `This rider currently has ${rider.activeTasks} active task(s).`
            )
        )
            return;
        setLoading(true);
        await onConfirm(request.id, +selectedRider);
        setLoading(false);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.6)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '460px',
                    width: '92vw',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    style={{
                        margin: '0 0 6px',
                        fontWeight: 900,
                        color: RC.crimson,
                        fontSize: '16px',
                    }}
                >
                    🏍 Assign Delivery Rider
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: RC.textMid }}>
                    Request #{request.id} · {request.bloodGroup} · {request.quantity} unit
                    {request.quantity > 1 ? 's' : ''} →{' '}
                    <strong>{request.hospitalName || 'Hospital'}</strong>
                </p>

                {available.length === 0 && busy.length === 0 && (
                    <div
                        style={{
                            padding: '16px',
                            borderRadius: '10px',
                            backgroundColor: RC.pinkBg,
                            border: `1.5px solid ${RC.crimsonLight}`,
                            marginBottom: '16px',
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 700,
                                color: RC.crimson,
                                fontSize: '13px',
                            }}
                        >
                            ⚠ No riders registered in the system yet.
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: RC.textMuted }}>
                            Ask the admin to register riders before assignment.
                        </p>
                    </div>
                )}

                {available.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                        <p
                            style={{
                                margin: '0 0 8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: RC.greenDark,
                            }}
                        >
                            ✅ Available Riders ({available.length})
                        </p>
                        {available.map((r) => (
                            <label
                                key={r.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    marginBottom: '6px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    border: `2px solid ${selectedRider == r.id ? RC.greenDark : RC.greenMid}`,
                                    backgroundColor:
                                        selectedRider == r.id ? RC.greenLight : '#FAFAFA',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="rider"
                                    value={r.id}
                                    checked={selectedRider == r.id}
                                    onChange={() => setSelected(r.id)}
                                    style={{ accentColor: RC.greenDark }}
                                />
                                <div style={{ flex: 1 }}>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            color: RC.textDark,
                                        }}
                                    >
                                        {r.name}
                                    </p>
                                    <p
                                        style={{
                                            margin: '2px 0 0',
                                            fontSize: '12px',
                                            color: RC.greenDark,
                                        }}
                                    >
                                        ✅ Free — no active deliveries
                                    </p>
                                </div>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 9px',
                                        borderRadius: '20px',
                                        backgroundColor: RC.greenLight,
                                        color: RC.greenDark,
                                        border: `1px solid ${RC.greenMid}`,
                                    }}
                                >
                                    Available
                                </span>
                            </label>
                        ))}
                    </div>
                )}

                {busy.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                        <p
                            style={{
                                margin: '0 0 8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#E65100',
                            }}
                        >
                            ⚠ Busy Riders ({busy.length}) — Will increase their load
                        </p>
                        {busy.map((r) => (
                            <label
                                key={r.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    marginBottom: '6px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    border: `2px solid ${selectedRider == r.id ? '#E65100' : '#FFD54F'}`,
                                    backgroundColor:
                                        selectedRider == r.id ? RC.cardYellow : '#FFFBF0',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="rider"
                                    value={r.id}
                                    checked={selectedRider == r.id}
                                    onChange={() => setSelected(r.id)}
                                    style={{ accentColor: '#E65100' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            color: RC.textDark,
                                        }}
                                    >
                                        {r.name}
                                    </p>
                                    <p
                                        style={{
                                            margin: '2px 0 0',
                                            fontSize: '12px',
                                            color: '#E65100',
                                        }}
                                    >
                                        ⚠ Has {r.activeTasks} active delivery in progress
                                    </p>
                                </div>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '3px 9px',
                                        borderRadius: '20px',
                                        backgroundColor: RC.cardYellow,
                                        color: '#E65100',
                                        border: '1px solid #FFD54F',
                                    }}
                                >
                                    Busy
                                </span>
                            </label>
                        ))}
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'flex-end',
                        marginTop: '8px',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: '9px 20px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            backgroundColor: '#E0E0E0',
                            color: RC.textMid,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedRider || loading}
                        style={{
                            padding: '9px 20px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 900,
                            backgroundColor: selectedRider ? RC.crimson : '#C0C0C0',
                            color: '#fff',
                            border: 'none',
                            cursor: selectedRider ? 'pointer' : 'not-allowed',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Assigning...' : '✓ Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Rejection Modal ─────────────────────────────────────────── */
function RejectModal({ request, onConfirm, onClose }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handle = async () => {
        setLoading(true);
        await onConfirm(request.id, reason);
        setLoading(false);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.6)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    maxWidth: '420px',
                    width: '92vw',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    style={{
                        margin: '0 0 6px',
                        fontWeight: 900,
                        color: RC.crimson,
                        fontSize: '16px',
                    }}
                >
                    ✕ Reject Blood Request
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: RC.textMid }}>
                    {request.patientName} · {request.bloodGroup} · {request.quantity} units
                </p>
                <label
                    style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: '6px',
                        color: RC.textMid,
                    }}
                >
                    Reason for rejection (shown to hospital)
                </label>
                <textarea
                    value={reason}
                    rows={3}
                    placeholder="e.g. Insufficient stock of this blood group currently..."
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '9px',
                        fontSize: '13px',
                        border: `1.5px solid ${RC.crimsonLight}`,
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box',
                        color: RC.textDark,
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'flex-end',
                        marginTop: '14px',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: '9px 20px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            backgroundColor: '#E0E0E0',
                            color: RC.textMid,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Go Back
                    </button>
                    <button
                        onClick={handle}
                        disabled={loading}
                        style={{
                            padding: '9px 20px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 900,
                            backgroundColor: RC.crimson,
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Rejecting...' : '✕ Confirm Rejection'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Requests Tab ─────────────────────────────────────────────── */
function RequestsTab({ onToast }) {
    const [requests, setRequests] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignReq, setAssignReq] = useState(null);
    const [rejectReq, setRejectReq] = useState(null);
    const [viewRec, setViewRec] = useState(null);
    const [filter, setFilter] = useState('PENDING');

    const load = useCallback(async () => {
        try {
            const [reqs, rids] = await Promise.all([
                apiFetch('/requests/blood-bank'),
                apiFetch('/users/riders').catch(() => []),
            ]);
            setRequests(reqs || []);
            setRiders(rids || []);
        } catch (e) {
            onToast('Failed to load requests: ' + e.message, 'error');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        load();
    }, [load]);

    const [processing, setProcessing] = useState({});

    const updateStatus = async (id, status, reason) => {
        if (processing[id]) return; // 🚫 prevent double click
        setProcessing((p) => ({ ...p, [id]: true }));

        try {
            await apiFetch(`/requests/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                    status,
                    reason: reason?.trim() || '',
                }),
            });

            onToast(
                `Request ${status === 'ACCEPTED' ? '✅ accepted' : '✕ rejected'} successfully.`
            );
            setRejectReq(null);
            load();
        } catch (e) {
            onToast('❌ ' + e.message, 'error');
            load(); // 🔥 refresh if error
        } finally {
            setProcessing((p) => ({ ...p, [id]: false }));
        }
    };

    const doAssignRider = async (reqId, riderId) => {
        try {
            await apiFetch(`/requests/${reqId}/assign-rider`, {
                method: 'PUT',
                body: JSON.stringify({ riderId }),
            });
            setAssignReq(null);
            onToast('🏍 Rider assigned successfully! Delivery OTP has been generated.');
            load();
        } catch (e) {
            onToast('❌ ' + e.message, 'error');
        }
    };

    const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);
    const pending = requests.filter((r) => r.status === 'PENDING').length;

    const FILTERS = [
        'ALL',
        'PENDING',
        'ACCEPTED',
        'ASSIGNED',
        'IN_TRANSIT',
        'DELIVERED',
        'REJECTED',
    ];

    return (
        <div>
            {assignReq && (
                <AssignRiderModal
                    request={assignReq}
                    riders={riders}
                    onConfirm={doAssignRider}
                    onClose={() => setAssignReq(null)}
                />
            )}
            {rejectReq && (
                <RejectModal
                    request={rejectReq}
                    onConfirm={async (id, reason) => {
                        await load(); // 🔥 refresh before action
                        updateStatus(id, 'REJECTED', reason);
                    }}
                    onClose={() => setRejectReq(null)}
                />
            )}
            {viewRec && <ReceiptModal request={viewRec} onClose={() => setViewRec(null)} />}

            {/* Toolbar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}
            >
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {pending > 0 && (
                        <span
                            style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 900,
                                backgroundColor: RC.pinkBg,
                                border: `2px solid ${RC.crimson}`,
                                color: RC.crimson,
                            }}
                        >
                            {pending} pending action{pending > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    onClick={load}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: RC.greenLight,
                        color: RC.greenDark,
                        border: `1px solid ${RC.greenMid}`,
                        cursor: 'pointer',
                    }}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Filter row */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '1.5px solid',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            backgroundColor: filter === f ? RC.crimson : '#fff',
                            color: filter === f ? '#fff' : RC.crimson,
                            borderColor: filter === f ? RC.crimsonDark : RC.crimsonLight,
                        }}
                    >
                        {f} {f !== 'ALL' && `(${requests.filter((r) => r.status === f).length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>
                    Loading...
                </div>
            ) : filtered.length === 0 ? (
                <RCCard variant="green" style={{ padding: '30px', textAlign: 'center' }}>
                    <p style={{ color: RC.greenDark, fontWeight: 600, margin: 0 }}>
                        No requests in this category.
                    </p>
                </RCCard>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[...filtered]
                        .sort((a, b) => (b.urgency === 'URGENT') - (a.urgency === 'URGENT'))
                        .map((r) => (
                            <RCCard
                                key={r.id}
                                variant={r.urgency === 'URGENT' ? 'pink' : 'white'}
                                style={
                                    r.urgency === 'URGENT'
                                        ? { border: `2px solid ${RC.crimson}` }
                                        : {}
                                }
                            >
                                <div style={{ padding: '16px' }}>
                                    {r.urgency === 'URGENT' && (
                                        <p
                                            style={{
                                                margin: '0 0 8px',
                                                fontSize: '11px',
                                                fontWeight: 900,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: RC.crimson,
                                            }}
                                        >
                                            🚨 Emergency / Urgent Request
                                        </p>
                                    )}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '16px',
                                                    flexWrap: 'wrap',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        color: RC.textMuted,
                                                    }}
                                                >
                                                    REQUEST #{r.id}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        color: RC.textMuted,
                                                    }}
                                                >
                                                    {r.createdAt
                                                        ? new Date(r.createdAt).toLocaleString(
                                                              'en-IN'
                                                          )
                                                        : ''}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: '4px 20px',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                <p style={{ margin: 0 }}>
                                                    <span
                                                        style={{
                                                            color: RC.textMuted,
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        Patient:
                                                    </span>{' '}
                                                    <strong style={{ color: RC.textDark }}>
                                                        {r.patientName}
                                                    </strong>
                                                </p>
                                                <p style={{ margin: 0 }}>
                                                    <span
                                                        style={{
                                                            color: RC.textMuted,
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        Blood:
                                                    </span>{' '}
                                                    <strong
                                                        style={{
                                                            color: RC.crimson,
                                                            fontSize: '15px',
                                                        }}
                                                    >
                                                        {r.bloodGroup}
                                                    </strong>
                                                </p>
                                                <p style={{ margin: 0 }}>
                                                    <span
                                                        style={{
                                                            color: RC.textMuted,
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        Qty:
                                                    </span>{' '}
                                                    <strong style={{ color: RC.textDark }}>
                                                        {r.quantity} units
                                                    </strong>
                                                </p>
                                                <p style={{ margin: 0 }}>
                                                    <span
                                                        style={{
                                                            color: RC.textMuted,
                                                            fontSize: '11px',
                                                        }}
                                                    >
                                                        Hospital:
                                                    </span>{' '}
                                                    <span style={{ color: RC.textMid }}>
                                                        {r.hospitalName || '—'}
                                                    </span>
                                                </p>
                                            </div>
                                            {r.notes && (
                                                <p
                                                    style={{
                                                        margin: '6px 0 0',
                                                        fontSize: '12px',
                                                        fontStyle: 'italic',
                                                        color: RC.textMuted,
                                                    }}
                                                >
                                                    📝 "{r.notes}"
                                                </p>
                                            )}
                                            {r.rejectionReason && (
                                                <p
                                                    style={{
                                                        margin: '6px 0 0',
                                                        fontSize: '12px',
                                                        color: RC.crimson,
                                                    }}
                                                >
                                                    Rejection reason: {r.rejectionReason}
                                                </p>
                                            )}
                                            {r.riderName && (
                                                <p
                                                    style={{
                                                        margin: '6px 0 0',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        color: RC.greenDark,
                                                    }}
                                                >
                                                    🏍 Rider: {r.riderName}
                                                </p>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-end',
                                                gap: '6px',
                                            }}
                                        >
                                            <StatusBadge status={r.status} />
                                            {r.hasReceipt && (
                                                <button
                                                    onClick={() => setViewRec(r)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '7px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        backgroundColor: RC.cardBlue,
                                                        color: '#1565C0',
                                                        border: '1px solid #90CAF9',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    📎 Receipt
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {r.status === 'PENDING' && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '8px',
                                                marginTop: '14px',
                                            }}
                                        >
                                            <button
                                                onClick={async () => {
                                                    await load();
                                                    updateStatus(r.id, 'ACCEPTED');
                                                }}
                                                style={{
                                                    padding: '8px 18px',
                                                    borderRadius: '9px',
                                                    fontSize: '13px',
                                                    fontWeight: 900,
                                                    backgroundColor: RC.greenDark,
                                                    color: '#fff',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ✓ Accept
                                            </button>
                                            <button
                                                onClick={() => setRejectReq(r)}
                                                style={{
                                                    padding: '8px 18px',
                                                    borderRadius: '9px',
                                                    fontSize: '13px',
                                                    fontWeight: 900,
                                                    backgroundColor: RC.pinkBg,
                                                    color: RC.crimson,
                                                    border: `1.5px solid ${RC.crimsonLight}`,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                ✕ Reject with Reason
                                            </button>
                                        </div>
                                    )}

                                    {r.status === 'ACCEPTED' && !r.riderId && (
                                        <button
                                            onClick={() => setAssignReq(r)}
                                            style={{
                                                marginTop: '12px',
                                                padding: '8px 18px',
                                                borderRadius: '9px',
                                                fontSize: '13px',
                                                fontWeight: 900,
                                                backgroundColor: RC.cardBlue,
                                                color: '#1565C0',
                                                border: '1.5px solid #90CAF9',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            🏍 Assign Rider
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

/* ── Inventory Tab ────────────────────────────────────────────── */
function InventoryTab({ onToast }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        bloodGroup: 'A+',
        quantity: 1,
        category: 'Whole Blood',
        collectionDate: '',
        expiryDate: '',
    });

    const load = useCallback(async () => {
        try {
            setInventory((await apiFetch('/inventory/my')) || []);
        } catch (e) {
            onToast('Failed to load inventory: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);
    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!form.collectionDate || !form.expiryDate) {
            onToast('⚠ Collection date and expiry date are required.', 'error');
            return;
        }
        if (new Date(form.expiryDate) <= new Date(form.collectionDate)) {
            onToast('⚠ Expiry date must be after the collection date.', 'error');
            return;
        }
        if (form.quantity < 1 || form.quantity > 500) {
            onToast('⚠ Quantity must be between 1 and 500 units.', 'error');
            return;
        }
        try {
            await apiFetch('/inventory', {
                method: 'POST',
                body: JSON.stringify({ ...form, quantity: +form.quantity }),
            });
            setShowForm(false);
            setForm({
                bloodGroup: 'A+',
                quantity: 1,
                category: 'Whole Blood',
                collectionDate: '',
                expiryDate: '',
            });
            onToast('✅ Blood units added to inventory successfully.');
            load();
        } catch (e) {
            onToast('❌ ' + e.message, 'error');
        }
    };

    const expiryStatus = (d) => {
        if (!d) return null;
        const days = (new Date(d) - new Date()) / 86400000;
        if (days < 0) return { color: RC.crimson, label: '⚠ Expired', bg: RC.pinkBg };
        if (days < 3)
            return { color: '#B71C1C', label: `🚨 ${Math.floor(days)}d left`, bg: '#FFEBEE' };
        if (days < 7)
            return { color: '#E65100', label: `⚠ ${Math.floor(days)}d left`, bg: RC.cardOrange };
        return { color: RC.greenDark, label: `${Math.floor(days)}d left`, bg: RC.greenLight };
    };

    const stock = BLOOD_GROUPS.reduce((acc, g) => {
        const qty = inventory.filter((i) => i.bloodGroup === g).reduce((s, i) => s + i.quantity, 0);
        if (qty > 0) acc[g] = qty;
        return acc;
    }, {});

    const expiredCount = inventory.filter(
        (i) => i.expiryDate && new Date(i.expiryDate) < new Date()
    ).length;

    return (
        <div>
            {expiredCount > 0 && (
                <RCCard
                    variant="pink"
                    style={{
                        padding: '12px 16px',
                        marginBottom: '14px',
                        border: `2px solid ${RC.crimson}`,
                    }}
                >
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '13px', color: RC.crimson }}>
                        🚨 {expiredCount} expired unit{expiredCount > 1 ? 's' : ''} in inventory —
                        please remove them immediately.
                    </p>
                </RCCard>
            )}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                }}
            >
                <div />
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '8px 18px',
                        borderRadius: '9px',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor: showForm ? '#E0E0E0' : RC.crimson,
                        color: showForm ? RC.textMid : '#fff',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {showForm ? '✕ Cancel' : '+ Add Blood Units'}
                </button>
            </div>

            {Object.keys(stock).length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                    <p
                        style={{
                            fontSize: '11px',
                            fontWeight: 900,
                            marginBottom: '8px',
                            color: RC.textMid,
                        }}
                    >
                        CURRENT STOCK BY BLOOD GROUP
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {BLOOD_GROUPS.filter((g) => stock[g]).map((g) => (
                            <div
                                key={g}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: RC.pinkBg,
                                    border: `2px solid ${RC.crimsonLight}`,
                                }}
                            >
                                <span
                                    style={{ fontWeight: 900, color: RC.crimson, fontSize: '13px' }}
                                >
                                    {g}
                                </span>
                                <span
                                    style={{
                                        padding: '2px 7px',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        fontWeight: 900,
                                        backgroundColor: RC.crimson,
                                        color: '#fff',
                                    }}
                                >
                                    {stock[g]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showForm && (
                <RCCard variant="pink" style={{ padding: '18px', marginBottom: '18px' }}>
                    <p
                        style={{
                            margin: '0 0 14px',
                            fontWeight: 900,
                            fontSize: '14px',
                            color: RC.crimson,
                        }}
                    >
                        Add Blood Units
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                            {
                                key: 'bloodGroup',
                                label: 'Blood Group',
                                type: 'select',
                                opts: BLOOD_GROUPS,
                            },
                            {
                                key: 'category',
                                label: 'Category',
                                type: 'select',
                                opts: CATEGORIES,
                            },
                            { key: 'collectionDate', label: 'Collection Date', type: 'date' },
                            { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
                        ].map(({ key, label, type, opts }) => (
                            <div key={key}>
                                <label
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        display: 'block',
                                        marginBottom: '5px',
                                        color: RC.textMid,
                                    }}
                                >
                                    {label} <span style={{ color: RC.crimson }}>*</span>
                                </label>
                                {type === 'select' ? (
                                    <select
                                        value={form[key]}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, [key]: e.target.value }))
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            border: `1.5px solid ${RC.crimsonLight}`,
                                            outline: 'none',
                                        }}
                                    >
                                        {opts.map((o) => (
                                            <option key={o}>{o}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={type}
                                        value={form[key]}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, [key]: e.target.value }))
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            border: `1.5px solid ${RC.crimsonLight}`,
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                        <div>
                            <label
                                style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    display: 'block',
                                    marginBottom: '5px',
                                    color: RC.textMid,
                                }}
                            >
                                Quantity (units) <span style={{ color: RC.crimson }}>*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="500"
                                value={form.quantity}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, quantity: +e.target.value || 1 }))
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    border: `1.5px solid ${RC.crimsonLight}`,
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={handleAdd}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '9px',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    backgroundColor: RC.crimson,
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                ✓ Save Units
                            </button>
                        </div>
                    </div>
                </RCCard>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>
                    Loading inventory...
                </div>
            ) : inventory.length === 0 ? (
                <RCCard variant="green" style={{ padding: '30px', textAlign: 'center' }}>
                    <p style={{ color: RC.greenDark, fontWeight: 600, margin: 0 }}>
                        No inventory yet. Add your first blood units above.
                    </p>
                </RCCard>
            ) : (
                <RCCard variant="white" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr
                                style={{
                                    backgroundColor: RC.pinkBg,
                                    borderBottom: `2px solid ${RC.crimsonLight}`,
                                }}
                            >
                                {[
                                    'Blood Group',
                                    'Category',
                                    'Qty',
                                    'Collected',
                                    'Expiry',
                                    'Status',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            textAlign: 'left',
                                            padding: '10px 14px',
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: RC.crimson,
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item, i) => {
                                const exp = expiryStatus(item.expiryDate);
                                return (
                                    <tr
                                        key={item.id}
                                        style={{
                                            backgroundColor: i % 2 === 0 ? '#fff' : RC.pinkSoft,
                                            borderBottom: '1px solid #F5E0E8',
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '10px 14px',
                                                fontWeight: 900,
                                                color: RC.crimson,
                                            }}
                                        >
                                            {item.bloodGroup}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: RC.textMid }}>
                                            {item.category}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 14px',
                                                fontWeight: 700,
                                                color: RC.textDark,
                                            }}
                                        >
                                            {item.quantity}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: RC.textMuted }}>
                                            {item.collectionDate || '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: RC.textMuted }}>
                                            {item.expiryDate || '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            {exp && (
                                                <span
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        padding: '3px 8px',
                                                        borderRadius: '20px',
                                                        backgroundColor: exp.bg,
                                                        color: exp.color,
                                                    }}
                                                >
                                                    {exp.label}
                                                </span>
                                            )}
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

/* ── Donors Tab ───────────────────────────────────────────────── */
function DonorsTab({ onToast }) {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', bloodGroup: 'A+', lastDonation: '' });
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        try {
            setDonors((await apiFetch('/donors/my')) || []);
        } catch (e) {
            onToast('Failed to load donors: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);
    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!form.name.trim() || form.name.trim().length < 2) {
            onToast('⚠ Donor name must be at least 2 characters.', 'error');
            return;
        }
        if (!form.phone || !/^[0-9]{10,15}$/.test(form.phone.trim())) {
            onToast('⚠ Phone must be 10–15 digits.', 'error');
            return;
        }
        try {
            await apiFetch('/donors', {
                method: 'POST',
                body: JSON.stringify({
                    ...form,
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    lastDonation: form.lastDonation || null,
                }),
            });
            setShowForm(false);
            setForm({ name: '', phone: '', bloodGroup: 'A+', lastDonation: '' });
            onToast('✅ Donor registered successfully.');
            load();
        } catch (e) {
            onToast('❌ ' + e.message, 'error');
        }
    };

    const filtered = donors.filter(
        (d) =>
            d.name?.toLowerCase().includes(search.toLowerCase()) ||
            d.phone?.includes(search) ||
            d.bloodGroup?.toLowerCase().includes(search.toLowerCase())
    );

    const byGroup = BLOOD_GROUPS.reduce(
        (acc, g) => ({
            ...acc,
            [g]: donors.filter((d) => d.bloodGroup === g).length,
        }),
        {}
    );

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '8px',
                }}
            >
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search by name, phone or blood group..."
                    style={{
                        padding: '8px 14px',
                        borderRadius: '9px',
                        border: `1.5px solid ${RC.crimsonLight}`,
                        fontSize: '13px',
                        outline: 'none',
                        minWidth: '220px',
                        flex: 1,
                        maxWidth: '320px',
                    }}
                />
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        padding: '8px 18px',
                        borderRadius: '9px',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor: showForm ? '#E0E0E0' : RC.crimson,
                        color: showForm ? RC.textMid : '#fff',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {showForm ? '✕ Cancel' : '+ Register Donor'}
                </button>
            </div>

            {/* Group summary pills */}
            {donors.length > 0 && (
                <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}
                >
                    {BLOOD_GROUPS.filter((g) => byGroup[g] > 0).map((g) => (
                        <span
                            key={g}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 700,
                                backgroundColor: RC.pinkBg,
                                border: `1.5px solid ${RC.crimsonLight}`,
                                color: RC.crimson,
                            }}
                        >
                            {g}: {byGroup[g]}
                        </span>
                    ))}
                </div>
            )}

            {showForm && (
                <RCCard variant="pink" style={{ padding: '18px', marginBottom: '18px' }}>
                    <p
                        style={{
                            margin: '0 0 14px',
                            fontWeight: 900,
                            fontSize: '14px',
                            color: RC.crimson,
                        }}
                    >
                        Register New Donor
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                            ['name', 'Full Name', 'text'],
                            ['phone', 'Phone Number', 'tel'],
                            ['lastDonation', 'Last Donation', 'date'],
                        ].map(([k, l, t]) => (
                            <div key={k}>
                                <label
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        display: 'block',
                                        marginBottom: '5px',
                                        color: RC.textMid,
                                    }}
                                >
                                    {l}
                                </label>
                                <input
                                    type={t}
                                    value={form[k]}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, [k]: e.target.value }))
                                    }
                                    placeholder={k === 'phone' ? '10-digit mobile number' : ''}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        border: `1.5px solid ${RC.crimsonLight}`,
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        ))}
                        <div>
                            <label
                                style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    display: 'block',
                                    marginBottom: '5px',
                                    color: RC.textMid,
                                }}
                            >
                                Blood Group
                            </label>
                            <select
                                value={form.bloodGroup}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, bloodGroup: e.target.value }))
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    border: `1.5px solid ${RC.crimsonLight}`,
                                    outline: 'none',
                                }}
                            >
                                {BLOOD_GROUPS.map((g) => (
                                    <option key={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                onClick={handleAdd}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '9px',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    backgroundColor: RC.crimson,
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                ✓ Save Donor
                            </button>
                        </div>
                    </div>
                </RCCard>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>
                    Loading donors...
                </div>
            ) : filtered.length === 0 ? (
                <RCCard variant="green" style={{ padding: '30px', textAlign: 'center' }}>
                    <p style={{ color: RC.greenDark, fontWeight: 600, margin: 0 }}>
                        {donors.length === 0
                            ? 'No donors registered yet.'
                            : 'No donors match your search.'}
                    </p>
                </RCCard>
            ) : (
                <RCCard variant="white" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr
                                style={{
                                    backgroundColor: RC.pinkBg,
                                    borderBottom: `2px solid ${RC.crimsonLight}`,
                                }}
                            >
                                {[
                                    'Name',
                                    'Phone',
                                    'Blood Group',
                                    'Last Donation',
                                    'Eligible Again',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        style={{
                                            textAlign: 'left',
                                            padding: '10px 14px',
                                            fontSize: '11px',
                                            fontWeight: 900,
                                            color: RC.crimson,
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((d, i) => {
                                const eligible = d.lastDonation
                                    ? new Date(d.lastDonation) <=
                                      new Date(Date.now() - 90 * 86400000)
                                    : true;
                                const eligibleDate = d.lastDonation
                                    ? new Date(
                                          new Date(d.lastDonation).getTime() + 90 * 86400000
                                      ).toLocaleDateString('en-IN')
                                    : '—';
                                return (
                                    <tr
                                        key={d.id}
                                        style={{
                                            backgroundColor: i % 2 === 0 ? '#fff' : RC.pinkSoft,
                                            borderBottom: '1px solid #F5E0E8',
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: '10px 14px',
                                                fontWeight: 600,
                                                color: RC.textDark,
                                            }}
                                        >
                                            {d.name}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: RC.textMid }}>
                                            {d.phone}
                                        </td>
                                        <td
                                            style={{
                                                padding: '10px 14px',
                                                fontWeight: 900,
                                                color: RC.crimson,
                                            }}
                                        >
                                            {d.bloodGroup}
                                        </td>
                                        <td style={{ padding: '10px 14px', color: RC.textMuted }}>
                                            {d.lastDonation || '—'}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    padding: '3px 8px',
                                                    borderRadius: '20px',
                                                    backgroundColor: eligible
                                                        ? RC.greenLight
                                                        : RC.cardYellow,
                                                    color: eligible ? RC.greenDark : '#E65100',
                                                }}
                                            >
                                                {eligible
                                                    ? '✅ Eligible now'
                                                    : `After ${eligibleDate}`}
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

/* ── Camps Tab ────────────────────────────────────────────────── */
function CampsTab({ onToast }) {
    const [camps, setCamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const emptyUnits = () => BLOOD_GROUPS.reduce((a, g) => ({ ...a, [g]: 0 }), {});
    const [form, setForm] = useState({
        name: '',
        location: '',
        campDate: '',
        latitude: '',
        longitude: '',
        bloodUnits: emptyUnits(),
    });

    const load = useCallback(async () => {
        try {
            setCamps((await apiFetch('/camps/my')) || []);
        } catch (e) {
            onToast('Failed to load camps: ' + e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);
    useEffect(() => {
        load();
    }, [load]);

    const total = (u) => Object.values(u).reduce((s, v) => s + (+v || 0), 0);

    const openEdit = (camp) => {
        const units = emptyUnits();
        if (camp.bloodUnitsJson) {
            try {
                Object.assign(units, JSON.parse(camp.bloodUnitsJson));
            } catch {}
        }
        setEditing(camp);
        setForm({
            name: camp.name,
            location: camp.location,
            campDate: camp.campDate,
            latitude: camp.latitude || '',
            longitude: camp.longitude || '',
            bloodUnits: units,
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.location.trim() || !form.campDate) {
            onToast('⚠ Camp name, location, and date are required.', 'error');
            return;
        }
        const payload = {
            name: form.name.trim(),
            location: form.location.trim(),
            campDate: form.campDate,
            latitude: form.latitude ? +form.latitude : null,
            longitude: form.longitude ? +form.longitude : null,
            totalUnitsCollected: total(form.bloodUnits),
            bloodUnitsJson: JSON.stringify(form.bloodUnits),
        };
        try {
            if (editing) {
                await apiFetch(`/camps/${editing.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                onToast('✅ Camp updated successfully.');
            } else {
                await apiFetch('/camps', { method: 'POST', body: JSON.stringify(payload) });
                onToast('✅ Camp created successfully.');
            }
            setShowForm(false);
            setEditing(null);
            load();
        } catch (e) {
            onToast('❌ ' + e.message, 'error');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                <button
                    onClick={() => {
                        setEditing(null);
                        setForm({
                            name: '',
                            location: '',
                            campDate: '',
                            latitude: '',
                            longitude: '',
                            bloodUnits: emptyUnits(),
                        });
                        setShowForm(true);
                    }}
                    style={{
                        padding: '8px 18px',
                        borderRadius: '9px',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor: RC.crimson,
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    + Create Camp
                </button>
            </div>

            {showForm && (
                <RCCard variant="pink" style={{ padding: '18px', marginBottom: '20px' }}>
                    <p
                        style={{
                            margin: '0 0 14px',
                            fontWeight: 900,
                            fontSize: '14px',
                            color: RC.crimson,
                        }}
                    >
                        {editing ? '✏️ Edit Camp' : '🏕️ Create Blood Donation Camp'}
                    </p>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            marginBottom: '16px',
                        }}
                    >
                        {[
                            ['name', 'Camp Name', 'text'],
                            ['location', 'Location / Venue', 'text'],
                            ['campDate', 'Camp Date', 'date'],
                            ['latitude', 'Latitude (optional)', 'number'],
                            ['longitude', 'Longitude (optional)', 'number'],
                        ].map(([k, l, t]) => (
                            <div key={k}>
                                <label
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        display: 'block',
                                        marginBottom: '5px',
                                        color: RC.textMid,
                                    }}
                                >
                                    {l}
                                </label>
                                <input
                                    type={t}
                                    value={form[k]}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, [k]: e.target.value }))
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        border: `1.5px solid ${RC.crimsonLight}`,
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    {/* Blood unit tracker */}
                    <div
                        style={{
                            padding: '14px',
                            borderRadius: '12px',
                            backgroundColor: '#fff',
                            border: `2px solid ${RC.crimsonLight}`,
                            marginBottom: '14px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontWeight: 900,
                                    fontSize: '14px',
                                    color: RC.crimson,
                                }}
                            >
                                🩸 Units Collected by Blood Group
                            </p>
                            <span
                                style={{
                                    padding: '4px 14px',
                                    borderRadius: '20px',
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    backgroundColor: RC.crimson,
                                    color: '#fff',
                                }}
                            >
                                Total: {total(form.bloodUnits)}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '10px',
                            }}
                        >
                            {BLOOD_GROUPS.map((g) => (
                                <div
                                    key={g}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '10px',
                                        textAlign: 'center',
                                        backgroundColor:
                                            form.bloodUnits[g] > 0 ? RC.pinkBg : '#F9F9F9',
                                        border: `1.5px solid ${form.bloodUnits[g] > 0 ? RC.crimsonLight : '#E0E0E0'}`,
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: '0 0 6px',
                                            fontWeight: 900,
                                            fontSize: '13px',
                                            color: RC.crimson,
                                        }}
                                    >
                                        {g}
                                    </p>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.bloodUnits[g]}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                bloodUnits: {
                                                    ...f.bloodUnits,
                                                    [g]: Math.max(0, +e.target.value || 0),
                                                },
                                            }))
                                        }
                                        style={{
                                            width: '100%',
                                            textAlign: 'center',
                                            fontWeight: 900,
                                            fontSize: '16px',
                                            padding: '4px',
                                            borderRadius: '8px',
                                            border: `1.5px solid ${RC.crimsonLight}`,
                                            outline: 'none',
                                            color:
                                                form.bloodUnits[g] > 0 ? RC.crimson : RC.textMuted,
                                        }}
                                    />
                                    <p
                                        style={{
                                            margin: '4px 0 0',
                                            fontSize: '10px',
                                            color: RC.textMuted,
                                        }}
                                    >
                                        units
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowForm(false)}
                            style={{
                                padding: '9px 20px',
                                borderRadius: '9px',
                                fontSize: '13px',
                                fontWeight: 700,
                                backgroundColor: '#E0E0E0',
                                color: RC.textMid,
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                padding: '9px 20px',
                                borderRadius: '9px',
                                fontSize: '13px',
                                fontWeight: 900,
                                backgroundColor: RC.crimson,
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            {editing ? 'Update Camp' : 'Save Camp'}
                        </button>
                    </div>
                </RCCard>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: RC.textMuted }}>
                    Loading camps...
                </div>
            ) : camps.length === 0 ? (
                <RCCard variant="green" style={{ padding: '30px', textAlign: 'center' }}>
                    <p style={{ color: RC.greenDark, fontWeight: 600, margin: 0 }}>
                        No camps created yet.
                    </p>
                </RCCard>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {camps.map((camp) => {
                        let units = null;
                        if (camp.bloodUnitsJson) {
                            try {
                                units = JSON.parse(camp.bloodUnitsJson);
                            } catch {}
                        }
                        const hasUnits = units && Object.values(units).some((v) => v > 0);
                        return (
                            <RCCard key={camp.id} variant="white" style={{ overflow: 'hidden' }}>
                                <div
                                    style={{
                                        padding: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        borderBottom: hasUnits
                                            ? `1px solid ${RC.crimsonLight}`
                                            : 'none',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <p
                                            style={{
                                                margin: '0 0 3px',
                                                fontWeight: 900,
                                                fontSize: '16px',
                                                color: RC.textDark,
                                            }}
                                        >
                                            {camp.name}
                                        </p>
                                        <p
                                            style={{
                                                margin: '0 0 2px',
                                                fontSize: '13px',
                                                color: RC.textMid,
                                            }}
                                        >
                                            📍 {camp.location}
                                        </p>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '12px',
                                                color: RC.textMuted,
                                            }}
                                        >
                                            📅 {camp.campDate}
                                        </p>
                                        {camp.latitude && (
                                            <p
                                                style={{
                                                    margin: '2px 0 0',
                                                    fontSize: '11px',
                                                    color: RC.textMuted,
                                                }}
                                            >
                                                🗺 {parseFloat(camp.latitude).toFixed(4)},{' '}
                                                {parseFloat(camp.longitude).toFixed(4)}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                                        <div
                                            style={{
                                                fontSize: '32px',
                                                fontWeight: 900,
                                                color: RC.crimson,
                                            }}
                                        >
                                            {camp.totalUnitsCollected || 0}
                                        </div>
                                        <div style={{ fontSize: '11px', color: RC.textMuted }}>
                                            total units
                                        </div>
                                        <button
                                            onClick={() => openEdit(camp)}
                                            style={{
                                                marginTop: '8px',
                                                padding: '5px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                backgroundColor: RC.greenLight,
                                                color: RC.greenDark,
                                                border: `1px solid ${RC.greenMid}`,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>
                                </div>
                                {hasUnits && (
                                    <div
                                        style={{
                                            padding: '12px 16px',
                                            backgroundColor: RC.pinkSoft,
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: '0 0 8px',
                                                fontSize: '11px',
                                                fontWeight: 900,
                                                color: RC.crimson,
                                            }}
                                        >
                                            UNITS COLLECTED BY BLOOD GROUP
                                        </p>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '6px',
                                            }}
                                        >
                                            {BLOOD_GROUPS.filter((g) => units[g] > 0).map((g) => (
                                                <div
                                                    key={g}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        padding: '4px 10px',
                                                        borderRadius: '20px',
                                                        backgroundColor: '#fff',
                                                        border: `1.5px solid ${RC.crimsonLight}`,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontWeight: 900,
                                                            fontSize: '13px',
                                                            color: RC.crimson,
                                                        }}
                                                    >
                                                        {g}
                                                    </span>
                                                    <span
                                                        style={{
                                                            padding: '1px 6px',
                                                            borderRadius: '10px',
                                                            fontSize: '11px',
                                                            fontWeight: 900,
                                                            backgroundColor: RC.crimson,
                                                            color: '#fff',
                                                        }}
                                                    >
                                                        {units[g]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </RCCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function BloodBankDashboard({ onLogout }) {
    const [tab, setTab] = useState('requests');
    const [toast, setToast] = useState(null);
    const entityName = localStorage.getItem('entityName') || 'Blood Bank';
    const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: RC.pinkSoft }}>
            {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
            <RCSidebar
                role="BLOOD_BANK"
                entityName={entityName}
                tabs={TABS}
                activeTab={tab}
                onTabChange={setTab}
                onLogout={onLogout}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <PageHeader
                    title={`${TABS.find((t) => t.key === tab)?.icon} ${TABS.find((t) => t.key === tab)?.label}`}
                />
                <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
                    {tab === 'requests' && <RequestsTab onToast={showToast} />}
                    {tab === 'inventory' && <InventoryTab onToast={showToast} />}
                    {tab === 'donors' && <DonorsTab onToast={showToast} />}
                    {tab === 'camps' && <CampsTab onToast={showToast} />}
                </main>
            </div>
        </div>
    );
}
