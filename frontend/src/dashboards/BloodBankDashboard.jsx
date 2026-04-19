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
            className="flex items-center px-8 py-4"
            style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}
        >
            <h2 className="font-black text-lg" style={{ color: RC.crimson }}>
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
        ASSIGNED: { bg: '#EDE7F6', color: '#512DA8' },
        IN_TRANSIT: { bg: RC.cardBlue, color: '#1565C0' },
        DELIVERED: { bg: RC.greenLight, color: RC.greenDark },
    };
    const s = map[status] || { bg: '#F5F5F5', color: RC.textMid };
    return (
        <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ backgroundColor: s.bg, color: s.color }}
        >
            {status.replace('_', ' ')}
        </span>
    );
}

// ── Inventory ────────────────────────────────────────────────────────────────
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
            setInventory(await apiFetch('/inventory/my'));
        } catch (e) {
            onToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);
    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!form.collectionDate || !form.expiryDate) {
            onToast('Collection and expiry dates are required.', 'error');
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
            onToast('Blood units added to inventory');
            load();
        } catch (e) {
            onToast(e.message, 'error');
        }
    };

    const expiryStatus = (d) => {
        if (!d) return null;
        const days = (new Date(d) - new Date()) / 86400000;
        if (days < 0) return { color: RC.crimson, label: '⚠️ Expired', bg: RC.pinkBg };
        if (days < 7)
            return { color: '#E65100', label: `⚠️ ${Math.floor(days)}d left`, bg: RC.cardOrange };
        return { color: RC.greenDark, label: `${Math.floor(days)}d left`, bg: RC.greenLight };
    };

    // Stock summary by blood group
    const stock = BLOOD_GROUPS.reduce((acc, g) => {
        const qty = inventory.filter((i) => i.bloodGroup === g).reduce((s, i) => s + i.quantity, 0);
        if (qty > 0) acc[g] = qty;
        return acc;
    }, {});

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div />
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{
                        backgroundColor: showForm ? '#E0E0E0' : RC.crimson,
                        color: showForm ? RC.textMid : '#fff',
                    }}
                >
                    {showForm ? '✕ Cancel' : '+ Add Units'}
                </button>
            </div>

            {/* Stock summary */}
            {Object.keys(stock).length > 0 && (
                <div className="mb-5">
                    <p className="text-xs font-black mb-2" style={{ color: RC.textMid }}>
                        CURRENT STOCK BY BLOOD GROUP
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {BLOOD_GROUPS.filter((g) => stock[g]).map((g) => (
                            <div
                                key={g}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black"
                                style={{
                                    backgroundColor: RC.pinkBg,
                                    border: `2px solid ${RC.crimsonLight}`,
                                    color: RC.crimson,
                                }}
                            >
                                {g}
                                <span
                                    className="px-1.5 py-0.5 rounded-full text-xs font-black"
                                    style={{ backgroundColor: RC.crimson, color: '#fff' }}
                                >
                                    {stock[g]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showForm && (
                <RCCard variant="pink" className="p-5 mb-5">
                    <p className="text-sm font-black mb-4" style={{ color: RC.crimson }}>
                        Add Blood Units
                    </p>
                    <div className="grid grid-cols-2 gap-4">
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
                                    className="text-xs font-bold block mb-1"
                                    style={{ color: RC.textMid }}
                                >
                                    {label}
                                </label>
                                {type === 'select' ? (
                                    <select
                                        value={form[key]}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, [key]: e.target.value }))
                                        }
                                        className="w-full p-2 rounded-lg text-sm outline-none"
                                        style={{ border: `1.5px solid ${RC.crimsonLight}` }}
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
                                        className="w-full p-2 rounded-lg text-sm outline-none"
                                        style={{ border: `1.5px solid ${RC.crimsonLight}` }}
                                    />
                                )}
                            </div>
                        ))}
                        <div>
                            <label
                                className="text-xs font-bold block mb-1"
                                style={{ color: RC.textMid }}
                            >
                                Quantity (units)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={form.quantity}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, quantity: +e.target.value || 1 }))
                                }
                                className="w-full p-2 rounded-lg text-sm outline-none"
                                style={{ border: `1.5px solid ${RC.crimsonLight}` }}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleAdd}
                                className="w-full py-2.5 rounded-lg text-sm font-black"
                                style={{ backgroundColor: RC.crimson, color: '#fff' }}
                            >
                                Save Units
                            </button>
                        </div>
                    </div>
                </RCCard>
            )}

            {loading ? (
                <p style={{ color: RC.textMuted }}>Loading inventory...</p>
            ) : inventory.length === 0 ? (
                <RCCard variant="green" className="p-6 text-center">
                    <p style={{ color: RC.greenDark }}>
                        No inventory yet. Add your first blood units above.
                    </p>
                </RCCard>
            ) : (
                <RCCard variant="white" className="overflow-hidden">
                    <table className="w-full text-sm">
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
                                        className="text-left px-4 py-3 text-xs font-black"
                                        style={{ color: RC.crimson }}
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
                                            className="px-4 py-3 font-black"
                                            style={{ color: RC.crimson }}
                                        >
                                            {item.bloodGroup}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: RC.textMid }}>
                                            {item.category}
                                        </td>
                                        <td
                                            className="px-4 py-3 font-bold"
                                            style={{ color: RC.textDark }}
                                        >
                                            {item.quantity}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: RC.textMuted }}>
                                            {item.collectionDate || '—'}
                                        </td>
                                        <td className="px-4 py-3" style={{ color: RC.textMuted }}>
                                            {item.expiryDate || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {exp && (
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                                    style={{
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

// ── Requests ─────────────────────────────────────────────────────────────────
function RequestsTab({ onToast }) {
    const [requests, setRequests] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigningId, setAssId] = useState(null);

    const load = useCallback(async () => {
        try {
            const [reqs, rids] = await Promise.all([
                apiFetch('/requests/blood-bank'),
                apiFetch('/users/riders'),
            ]);
            setRequests(reqs);
            setRiders(rids);
        } catch (e) {
            onToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);
    useEffect(() => {
        load();
    }, [load]);

    const updateStatus = async (id, status) => {
        try {
            await apiFetch(`/requests/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            onToast(`Request ${status.toLowerCase()}`);
            load();
        } catch (e) {
            onToast(e.message, 'error');
        }
    };

    const assignRider = async (reqId, riderId) => {
        try {
            await apiFetch(`/requests/${reqId}/assign-rider`, {
                method: 'PUT',
                body: JSON.stringify({ riderId }),
            });
            setAssId(null);
            onToast('Rider assigned successfully');
            load();
        } catch (e) {
            onToast(e.message, 'error');
        }
    };

    const pending = requests.filter((r) => r.status === 'PENDING');

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                {pending.length > 0 && (
                    <div
                        className="px-3 py-1.5 rounded-full text-xs font-black"
                        style={{
                            backgroundColor: RC.pinkBg,
                            border: `2px solid ${RC.crimson}`,
                            color: RC.crimson,
                        }}
                    >
                        {pending.length} pending action{pending.length > 1 ? 's' : ''}
                    </div>
                )}
                <button
                    onClick={load}
                    className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ backgroundColor: RC.greenLight, color: RC.greenDark }}
                >
                    ↻ Refresh
                </button>
            </div>

            {loading ? (
                <p style={{ color: RC.textMuted }}>Loading requests...</p>
            ) : requests.length === 0 ? (
                <RCCard variant="green" className="p-6 text-center">
                    <p style={{ color: RC.greenDark }}>No requests yet.</p>
                </RCCard>
            ) : (
                <div className="space-y-4">
                    {[...requests]
                        .sort((a, b) => (b.urgency === 'URGENT') - (a.urgency === 'URGENT'))
                        .map((r) => (
                            <RCCard
                                key={r.id}
                                variant={r.urgency === 'URGENT' ? 'pink' : 'white'}
                                style={
                                    r.urgency === 'URGENT'
                                        ? { borderColor: RC.crimson, borderWidth: '2px' }
                                        : {}
                                }
                            >
                                <div className="p-4">
                                    {r.urgency === 'URGENT' && (
                                        <p
                                            className="text-xs font-black uppercase tracking-wide mb-3"
                                            style={{ color: RC.crimson }}
                                        >
                                            🚨 Emergency / Urgent Request
                                        </p>
                                    )}
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1 text-sm flex-1">
                                            <p>
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: RC.textMuted }}
                                                >
                                                    Patient:
                                                </span>{' '}
                                                <span
                                                    className="font-semibold"
                                                    style={{ color: RC.textDark }}
                                                >
                                                    {r.patientName}
                                                </span>
                                            </p>
                                            <p>
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: RC.textMuted }}
                                                >
                                                    Blood:
                                                </span>{' '}
                                                <span
                                                    className="font-black ml-1"
                                                    style={{ color: RC.crimson }}
                                                >
                                                    {r.bloodGroup}
                                                </span>
                                            </p>
                                            <p>
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: RC.textMuted }}
                                                >
                                                    Qty:
                                                </span>{' '}
                                                <span style={{ color: RC.textDark }}>
                                                    {' '}
                                                    {r.quantity} units
                                                </span>
                                            </p>
                                            <p>
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: RC.textMuted }}
                                                >
                                                    Hospital:
                                                </span>{' '}
                                                <span style={{ color: RC.textMid }}>
                                                    {' '}
                                                    {r.hospitalName || '—'}
                                                </span>
                                            </p>
                                            {r.notes && (
                                                <p
                                                    className="text-xs italic"
                                                    style={{ color: RC.textMuted }}
                                                >
                                                    "{r.notes}"
                                                </p>
                                            )}
                                            {r.riderName && (
                                                <p
                                                    className="text-xs font-bold"
                                                    style={{ color: RC.greenDark }}
                                                >
                                                    🏍 {r.riderName}
                                                </p>
                                            )}
                                        </div>
                                        <StatusBadge status={r.status} />
                                    </div>

                                    {r.status === 'PENDING' && (
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => updateStatus(r.id, 'ACCEPTED')}
                                                className="px-4 py-2 rounded-lg text-sm font-bold"
                                                style={{
                                                    backgroundColor: RC.greenDark,
                                                    color: '#fff',
                                                }}
                                            >
                                                ✓ Accept
                                            </button>
                                            <button
                                                onClick={() => updateStatus(r.id, 'REJECTED')}
                                                className="px-4 py-2 rounded-lg text-sm font-bold"
                                                style={{
                                                    backgroundColor: RC.crimson,
                                                    color: '#fff',
                                                }}
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    )}

                                    {r.status === 'ACCEPTED' && !r.riderId && (
                                        <div className="mt-4">
                                            {assigningId === r.id ? (
                                                <div className="flex gap-2">
                                                    <select
                                                        className="p-2 rounded-lg text-sm flex-1 outline-none"
                                                        style={{
                                                            border: `1.5px solid ${RC.crimsonLight}`,
                                                        }}
                                                        defaultValue=""
                                                        onChange={(e) =>
                                                            e.target.value &&
                                                            assignRider(r.id, e.target.value)
                                                        }
                                                    >
                                                        <option value="" disabled>
                                                            Select a rider...
                                                        </option>
                                                        {riders.map((rd) => (
                                                            <option key={rd.id} value={rd.id}>
                                                                {rd.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => setAssId(null)}
                                                        className="px-3 text-sm font-bold"
                                                        style={{ color: RC.textMuted }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAssId(r.id)}
                                                    className="px-4 py-2 rounded-lg text-sm font-bold"
                                                    style={{
                                                        backgroundColor: RC.cardBlue,
                                                        color: '#1565C0',
                                                        border: '1.5px solid #90CAF9',
                                                    }}
                                                >
                                                    🏍 Assign Rider
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </RCCard>
                        ))}
                </div>
            )}
        </div>
    );
}

// ── Donors ───────────────────────────────────────────────────────────────────
function DonorsTab({ onToast }) {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', bloodGroup: 'A+', lastDonation: '' });

    const load = useCallback(async () => {
        try {
            setDonors(await apiFetch('/donors/my'));
        } catch (e) {
            onToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);
    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!form.name || !form.phone) {
            onToast('Name and phone are required', 'error');
            return;
        }
        try {
            await apiFetch('/donors', { method: 'POST', body: JSON.stringify(form) });
            setShowForm(false);
            setForm({ name: '', phone: '', bloodGroup: 'A+', lastDonation: '' });
            onToast('Donor registered successfully');
            load();
        } catch (e) {
            onToast(e.message, 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 rounded-lg text-sm font-bold"
                    style={{
                        backgroundColor: showForm ? '#E0E0E0' : RC.crimson,
                        color: showForm ? RC.textMid : '#fff',
                    }}
                >
                    {showForm ? '✕ Cancel' : '+ Register Donor'}
                </button>
            </div>

            {showForm && (
                <RCCard variant="pink" className="p-5 mb-5">
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            ['name', 'Full Name', 'text'],
                            ['phone', 'Phone Number', 'text'],
                            ['lastDonation', 'Last Donation', 'date'],
                        ].map(([k, l, t]) => (
                            <div key={k}>
                                <label
                                    className="text-xs font-bold block mb-1"
                                    style={{ color: RC.textMid }}
                                >
                                    {l}
                                </label>
                                <input
                                    type={t}
                                    value={form[k]}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, [k]: e.target.value }))
                                    }
                                    className="w-full p-2 rounded-lg text-sm outline-none"
                                    style={{ border: `1.5px solid ${RC.crimsonLight}` }}
                                />
                            </div>
                        ))}
                        <div>
                            <label
                                className="text-xs font-bold block mb-1"
                                style={{ color: RC.textMid }}
                            >
                                Blood Group
                            </label>
                            <select
                                value={form.bloodGroup}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, bloodGroup: e.target.value }))
                                }
                                className="w-full p-2 rounded-lg text-sm outline-none"
                                style={{ border: `1.5px solid ${RC.crimsonLight}` }}
                            >
                                {BLOOD_GROUPS.map((g) => (
                                    <option key={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 flex justify-end">
                            <button
                                onClick={handleAdd}
                                className="px-6 py-2.5 rounded-lg text-sm font-black"
                                style={{ backgroundColor: RC.crimson, color: '#fff' }}
                            >
                                Save Donor
                            </button>
                        </div>
                    </div>
                </RCCard>
            )}

            {loading ? (
                <p style={{ color: RC.textMuted }}>Loading donors...</p>
            ) : donors.length === 0 ? (
                <RCCard variant="green" className="p-6 text-center">
                    <p style={{ color: RC.greenDark }}>No donors registered yet.</p>
                </RCCard>
            ) : (
                <RCCard variant="white" className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr
                                style={{
                                    backgroundColor: RC.pinkBg,
                                    borderBottom: `2px solid ${RC.crimsonLight}`,
                                }}
                            >
                                {['Name', 'Phone', 'Blood Group', 'Last Donation'].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-4 py-3 text-xs font-black"
                                        style={{ color: RC.crimson }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {donors.map((d, i) => (
                                <tr
                                    key={d.id}
                                    style={{
                                        backgroundColor: i % 2 === 0 ? '#fff' : RC.pinkSoft,
                                        borderBottom: '1px solid #F5E0E8',
                                    }}
                                >
                                    <td
                                        className="px-4 py-3 font-semibold"
                                        style={{ color: RC.textDark }}
                                    >
                                        {d.name}
                                    </td>
                                    <td className="px-4 py-3" style={{ color: RC.textMid }}>
                                        {d.phone}
                                    </td>
                                    <td
                                        className="px-4 py-3 font-black"
                                        style={{ color: RC.crimson }}
                                    >
                                        {d.bloodGroup}
                                    </td>
                                    <td className="px-4 py-3" style={{ color: RC.textMuted }}>
                                        {d.lastDonation || '—'}
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

// ── Camps ─────────────────────────────────────────────────────────────────────
// KEY FEATURE: per-blood-group unit tracking in camp form
function CampsTab({ onToast }) {
    const [camps, setCamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCamp, setEditingCamp] = useState(null);

    // Blood group unit counts — the key new feature
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
            setCamps(await apiFetch('/camps/my'));
        } catch (e) {
            onToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);
    useEffect(() => {
        load();
    }, [load]);

    const totalUnits = (units) => Object.values(units).reduce((s, v) => s + (+v || 0), 0);

    const openNew = () => {
        setEditingCamp(null);
        setForm({
            name: '',
            location: '',
            campDate: '',
            latitude: '',
            longitude: '',
            bloodUnits: emptyUnits(),
        });
        setShowForm(true);
    };

    const openEdit = (camp) => {
        // Parse existing units from camp — stored as JSON string in notes or as totalUnitsCollected
        const units = emptyUnits();
        if (camp.bloodUnitsJson) {
            try {
                Object.assign(units, JSON.parse(camp.bloodUnitsJson));
            } catch {}
        }
        setEditingCamp(camp);
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
        if (!form.name || !form.location || !form.campDate) {
            onToast('Camp name, location and date are required.', 'error');
            return;
        }
        const total = totalUnits(form.bloodUnits);
        const payload = {
            name: form.name,
            location: form.location,
            campDate: form.campDate,
            latitude: form.latitude ? +form.latitude : null,
            longitude: form.longitude ? +form.longitude : null,
            totalUnitsCollected: total,
            bloodUnitsJson: JSON.stringify(form.bloodUnits),
        };
        try {
            if (editingCamp) {
                await apiFetch(`/camps/${editingCamp.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                onToast('Camp updated successfully');
            } else {
                await apiFetch('/camps', { method: 'POST', body: JSON.stringify(payload) });
                onToast('Camp created successfully');
            }
            setShowForm(false);
            load();
        } catch (e) {
            onToast(e.message, 'error');
        }
    };

    const setUnit = (g, val) =>
        setForm((f) => ({
            ...f,
            bloodUnits: { ...f.bloodUnits, [g]: Math.max(0, +val || 0) },
        }));

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={openNew}
                    className="px-4 py-2 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: RC.crimson, color: '#fff' }}
                >
                    + Create Camp
                </button>
            </div>

            {showForm && (
                <RCCard variant="pink" className="p-5 mb-6">
                    <p className="text-sm font-black mb-4" style={{ color: RC.crimson }}>
                        {editingCamp ? '✏️ Edit Camp' : '🏕️ Create Blood Donation Camp'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                        {[
                            ['name', 'Camp Name', 'text'],
                            ['location', 'Location', 'text'],
                            ['campDate', 'Camp Date', 'date'],
                            ['latitude', 'Latitude (opt)', 'number'],
                            ['longitude', 'Longitude (opt)', 'number'],
                        ].map(([k, l, t]) => (
                            <div key={k}>
                                <label
                                    className="text-xs font-bold block mb-1"
                                    style={{ color: RC.textMid }}
                                >
                                    {l}
                                </label>
                                <input
                                    type={t}
                                    value={form[k]}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, [k]: e.target.value }))
                                    }
                                    className="w-full p-2 rounded-lg text-sm outline-none"
                                    style={{ border: `1.5px solid ${RC.crimsonLight}` }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── Blood unit collection tracker ── */}
                    <div
                        className="rounded-xl p-4 mb-4"
                        style={{ backgroundColor: '#fff', border: `2px solid ${RC.crimsonLight}` }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-black" style={{ color: RC.crimson }}>
                                🩸 Units Collected by Blood Group
                            </p>
                            <div
                                className="px-3 py-1 rounded-full text-sm font-black"
                                style={{ backgroundColor: RC.crimson, color: '#fff' }}
                            >
                                Total: {totalUnits(form.bloodUnits)} units
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {BLOOD_GROUPS.map((g) => (
                                <div
                                    key={g}
                                    className="rounded-lg p-2 text-center"
                                    style={{
                                        backgroundColor:
                                            form.bloodUnits[g] > 0 ? RC.pinkBg : '#F9F9F9',
                                        border: `1.5px solid ${form.bloodUnits[g] > 0 ? RC.crimsonLight : '#E0E0E0'}`,
                                    }}
                                >
                                    <p
                                        className="text-sm font-black mb-1.5"
                                        style={{ color: RC.crimson }}
                                    >
                                        {g}
                                    </p>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.bloodUnits[g]}
                                        onChange={(e) => setUnit(g, e.target.value)}
                                        className="w-full text-center font-black text-base rounded-lg p-1 outline-none"
                                        style={{
                                            border: `1.5px solid ${RC.crimsonLight}`,
                                            color:
                                                form.bloodUnits[g] > 0 ? RC.crimson : RC.textMuted,
                                        }}
                                    />
                                    <p className="text-xs mt-1" style={{ color: RC.textMuted }}>
                                        units
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-5 py-2 rounded-lg text-sm font-bold"
                            style={{ backgroundColor: '#E0E0E0', color: RC.textMid }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 rounded-lg text-sm font-black"
                            style={{ backgroundColor: RC.crimson, color: '#fff' }}
                        >
                            {editingCamp ? 'Update Camp' : 'Save Camp'}
                        </button>
                    </div>
                </RCCard>
            )}

            {loading ? (
                <p style={{ color: RC.textMuted }}>Loading camps...</p>
            ) : camps.length === 0 ? (
                <RCCard variant="green" className="p-6 text-center">
                    <p style={{ color: RC.greenDark }}>No camps created yet.</p>
                </RCCard>
            ) : (
                <div className="space-y-4">
                    {camps.map((camp) => {
                        let units = null;
                        if (camp.bloodUnitsJson) {
                            try {
                                units = JSON.parse(camp.bloodUnitsJson);
                            } catch {}
                        }
                        const hasUnits = units && Object.values(units).some((v) => v > 0);
                        return (
                            <RCCard key={camp.id} variant="white" className="overflow-hidden">
                                {/* Camp header */}
                                <div
                                    className="p-4 flex justify-between items-start"
                                    style={{
                                        borderBottom: hasUnits
                                            ? `1px solid ${RC.crimsonLight}`
                                            : 'none',
                                    }}
                                >
                                    <div className="flex-1">
                                        <p
                                            className="font-black text-base"
                                            style={{ color: RC.textDark }}
                                        >
                                            {camp.name}
                                        </p>
                                        <p className="text-sm mt-0.5" style={{ color: RC.textMid }}>
                                            📍 {camp.location}
                                        </p>
                                        <p className="text-sm" style={{ color: RC.textMuted }}>
                                            📅 {camp.campDate}
                                        </p>
                                        {camp.latitude && (
                                            <p
                                                className="text-xs mt-0.5"
                                                style={{ color: RC.textMuted }}
                                            >
                                                🗺 {parseFloat(camp.latitude).toFixed(4)},{' '}
                                                {parseFloat(camp.longitude).toFixed(4)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <div
                                            className="text-3xl font-black"
                                            style={{ color: RC.crimson }}
                                        >
                                            {camp.totalUnitsCollected || 0}
                                        </div>
                                        <div className="text-xs" style={{ color: RC.textMuted }}>
                                            total units
                                        </div>
                                        <button
                                            onClick={() => openEdit(camp)}
                                            className="mt-2 px-3 py-1 rounded-lg text-xs font-bold"
                                            style={{
                                                backgroundColor: RC.greenLight,
                                                color: RC.greenDark,
                                            }}
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>
                                </div>

                                {/* Per blood group breakdown */}
                                {hasUnits && (
                                    <div
                                        className="px-4 py-3"
                                        style={{ backgroundColor: RC.pinkSoft }}
                                    >
                                        <p
                                            className="text-xs font-black mb-2"
                                            style={{ color: RC.crimson }}
                                        >
                                            UNITS COLLECTED BY BLOOD GROUP
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {BLOOD_GROUPS.filter((g) => units[g] > 0).map((g) => (
                                                <div
                                                    key={g}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                                                    style={{
                                                        backgroundColor: '#fff',
                                                        border: `1.5px solid ${RC.crimsonLight}`,
                                                    }}
                                                >
                                                    <span
                                                        className="font-black text-sm"
                                                        style={{ color: RC.crimson }}
                                                    >
                                                        {g}
                                                    </span>
                                                    <span
                                                        className="text-xs px-1.5 py-0.5 rounded-full font-black"
                                                        style={{
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

// ── Main ─────────────────────────────────────────────────────────────────────
export default function BloodBankDashboard({ onLogout }) {
    const [tab, setTab] = useState('requests');
    const [toast, setToast] = useState(null);
    const entityName = localStorage.getItem('entityName') || 'Blood Bank';
    const showToast = (msg, type = 'success') => setToast({ msg, type });

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: RC.pinkSoft }}>
            {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
            <RCSidebar
                role="BLOOD_BANK"
                entityName={entityName}
                tabs={TABS}
                activeTab={tab}
                onTabChange={setTab}
                onLogout={onLogout}
            />
            <div className="flex-1 flex flex-col">
                <PageHeader
                    title={
                        TABS.find((t) => t.key === tab)?.icon +
                        ' ' +
                        TABS.find((t) => t.key === tab)?.label
                    }
                />
                <main className="flex-1 p-8 overflow-y-auto">
                    {tab === 'requests' && <RequestsTab onToast={showToast} />}
                    {tab === 'inventory' && <InventoryTab onToast={showToast} />}
                    {tab === 'donors' && <DonorsTab onToast={showToast} />}
                    {tab === 'camps' && <CampsTab onToast={showToast} />}
                </main>
            </div>
        </div>
    );
}
