import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/api';
import RCSidebar from '../components/RCSidebar';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC } from '../components/RCTheme';

const TABS = [
  { key:'analytics', icon:'📊', label:'Analytics'   },
  { key:'users',     icon:'👥', label:'Users'        },
  { key:'requests',  icon:'🩸', label:'All Requests' },
  { key:'inventory', icon:'📦', label:'Inventory'    },
];

const PAGE = 20;

function PageHeader({ title }) {
  return (
    <div style={{ backgroundColor: RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}`, padding:'14px 28px' }}>
      <h2 style={{ margin:0, fontWeight:900, fontSize:'17px', color: RC.crimson }}>{title}</h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:   { bg: RC.cardYellow, color:'#E65100' },
    ACCEPTED:  { bg: RC.greenLight, color: RC.greenDark },
    REJECTED:  { bg: RC.pinkBg,     color: RC.crimson },
    CANCELLED: { bg:'#F5F5F5',       color:'#888' },
    ASSIGNED:  { bg:'#EDE7F6',      color:'#512DA8' },
    IN_TRANSIT:{ bg: RC.cardBlue,   color:'#1565C0' },
    DELIVERED: { bg: RC.greenLight, color: RC.greenDark },
  };
  const s = map[status] || { bg:'#F5F5F5', color: RC.textMid };
  return (
    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'20px',
      backgroundColor: s.bg, color: s.color, whiteSpace:'nowrap' }}>
      {status?.replace('_',' ')}
    </span>
  );
}

const ROLE_COLOR = {
  HOSPITAL:   { bg:'#E3F2FD', color:'#1565C0' },
  BLOOD_BANK: { bg: RC.pinkBg, color: RC.crimson },
  RIDER:      { bg: RC.cardYellow, color:'#E65100' },
  ADMIN:      { bg:'#EDE7F6', color:'#512DA8' },
};

function Pagination({ page, total, size, onChange }) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
      <span style={{ fontSize:'12px', color: RC.textMuted }}>
        Showing {page*size+1}–{Math.min((page+1)*size, total)} of {total}
      </span>
      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
        <button disabled={page===0} onClick={() => onChange(page-1)}
          style={{ padding:'5px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:700,
            backgroundColor: RC.pinkBg, color: RC.crimson, border:`1.5px solid ${RC.crimsonLight}`,
            cursor: page===0 ? 'not-allowed':'pointer', opacity: page===0 ? 0.4:1 }}>
          ← Prev
        </button>
        <span style={{ fontSize:'12px', fontWeight:700, color: RC.textMid, padding:'0 4px' }}>
          {page+1} / {pages}
        </span>
        <button disabled={page>=pages-1} onClick={() => onChange(page+1)}
          style={{ padding:'5px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:700,
            backgroundColor: RC.pinkBg, color: RC.crimson, border:`1.5px solid ${RC.crimsonLight}`,
            cursor: page>=pages-1 ? 'not-allowed':'pointer', opacity: page>=pages-1 ? 0.4:1 }}>
          Next →
        </button>
      </div>
    </div>
  );
}

/* ── Analytics Tab ────────────────────────────────────────────── */
function AnalyticsTab({ summary, loading }) {
  const statCards = [
    { key:'total',     label:'Total Requests',  color: RC.crimson,   bg: RC.pinkBg,    border: RC.crimsonLight },
    { key:'pending',   label:'Pending',          color:'#E65100',     bg: RC.cardYellow, border:'#FFD54F' },
    { key:'accepted',  label:'Accepted',         color: RC.greenDark, bg: RC.greenLight, border: RC.greenMid },
    { key:'assigned',  label:'Assigned',         color:'#512DA8',     bg:'#EDE7F6',      border:'#CE93D8' },
    { key:'inTransit', label:'In Transit',       color:'#1565C0',     bg: RC.cardBlue,   border:'#90CAF9' },
    { key:'delivered', label:'Delivered',        color: RC.greenDark, bg: RC.greenLight, border: RC.greenMid },
    { key:'rejected',  label:'Rejected',         color: RC.crimson,   bg: RC.pinkBg,    border: RC.crimsonLight },
    { key:'cancelled', label:'Cancelled',        color:'#888',        bg:'#F5F5F5',      border:'#E0E0E0' },
  ];

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color: RC.textMuted }}>Loading analytics...</div>;

  const fulfilmentRate = summary?.total > 0
    ? ((summary.delivered / summary.total) * 100).toFixed(1) : 0;
  const rejectionRate  = summary?.total > 0
    ? (((summary.rejected + (summary.cancelled||0)) / summary.total) * 100).toFixed(1) : 0;

  return (
    <div>
      {/* KPI bar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'24px' }}>
        {[
          { label:'Fulfilment Rate', value:`${fulfilmentRate}%`, note:'Delivered / Total', color: RC.greenDark, bg: RC.greenLight, border: RC.greenMid },
          { label:'Rejection Rate',  value:`${rejectionRate}%`,  note:'Rejected+Cancelled / Total', color:'#E65100', bg: RC.cardYellow, border:'#FFD54F' },
          { label:'Active Flow',     value: (summary?.pending||0)+(summary?.accepted||0)+(summary?.assigned||0)+(summary?.inTransit||0),
            note:'Pending+Accepted+Assigned+Transit', color:'#1565C0', bg: RC.cardBlue, border:'#90CAF9' },
        ].map(k => (
          <div key={k.label} style={{ borderRadius:'14px', padding:'18px',
            backgroundColor: k.bg, border:`2px solid ${k.border}`, textAlign:'center' }}>
            <div style={{ fontSize:'32px', fontWeight:900, color: k.color }}>{k.value}</div>
            <div style={{ fontSize:'13px', fontWeight:700, color: RC.textMid, marginTop:'4px' }}>{k.label}</div>
            <div style={{ fontSize:'11px', color: RC.textMuted, marginTop:'2px' }}>{k.note}</div>
          </div>
        ))}
      </div>

      {/* Status cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'24px' }}>
        {statCards.map(s => summary?.[s.key] != null && (
          <div key={s.key} style={{ borderRadius:'12px', padding:'14px', textAlign:'center',
            backgroundColor: s.bg, border:`2px solid ${s.border}` }}>
            <div style={{ fontSize:'26px', fontWeight:900, color: s.color }}>{summary[s.key]}</div>
            <div style={{ fontSize:'11px', fontWeight:600, color: RC.textMid, marginTop:'3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Visual bar */}
      {summary?.total > 0 && (
        <RCCard variant="white" style={{ padding:'18px', marginBottom:'20px' }}>
          <p style={{ margin:'0 0 12px', fontSize:'11px', fontWeight:900, color: RC.textMid }}>
            REQUEST STATUS BREAKDOWN
          </p>
          <div style={{ display:'flex', height:'18px', borderRadius:'9px', overflow:'hidden', gap:'2px', marginBottom:'12px' }}>
            {[
              { k:'delivered', color: RC.greenDark },
              { k:'accepted',  color: RC.green },
              { k:'assigned',  color:'#7B1FA2' },
              { k:'inTransit', color:'#1976D2' },
              { k:'pending',   color:'#F57C00' },
              { k:'rejected',  color: RC.crimson },
              { k:'cancelled', color:'#9E9E9E' },
            ].map(({ k, color }) => summary[k] > 0 && (
              <div key={k} title={`${k}: ${summary[k]}`}
                style={{ flex: summary[k]/summary.total, backgroundColor: color,
                  borderRadius:'4px', transition:'flex 0.5s' }} />
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'12px' }}>
            {[
              { k:'delivered', color: RC.greenDark, l:'Delivered' },
              { k:'accepted',  color: RC.green,     l:'Accepted'  },
              { k:'assigned',  color:'#7B1FA2',     l:'Assigned'  },
              { k:'inTransit', color:'#1976D2',     l:'In Transit'},
              { k:'pending',   color:'#F57C00',     l:'Pending'   },
              { k:'rejected',  color: RC.crimson,   l:'Rejected'  },
              { k:'cancelled', color:'#9E9E9E',     l:'Cancelled' },
            ].map(({ k, color, l }) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', color: RC.textMid }}>
                <div style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor: color, flexShrink:0 }} />
                {l} ({summary?.[k] || 0})
              </div>
            ))}
          </div>
        </RCCard>
      )}

      {/* Mission note */}
      <div style={{ borderRadius:'14px', padding:'18px', textAlign:'center', backgroundColor: RC.crimson }}>
        <p style={{ margin:'0 0 4px', fontWeight:900, fontSize:'14px', color:'#fff' }}>
          "Together, we can make India blood-secure."
        </p>
        <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.75)' }}>
          R C Foundation · Reg. No. E-13086 · Always Ready to Help You · Mumbai
        </p>
      </div>
    </div>
  );
}

/* ── Users Tab ────────────────────────────────────────────────── */
function UsersTab({ onToast }) {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRF]   = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await apiFetch(`/admin/users?page=${page}&size=${PAGE}`);
      setUsers(u.content || []); setTotal(u.totalElements || 0);
    } catch (e) { onToast('Failed to load users: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, [page, onToast]);
  useEffect(() => { load(); }, [load]);

  const deactivate = async (id, name) => {
    if (!window.confirm(`Deactivate account for "${name}"?\nThey will no longer be able to log in.`)) return;
    try {
      await apiFetch(`/admin/users/${id}`, { method:'DELETE' });
      onToast(`✅ ${name}'s account has been deactivated.`);
      load();
    } catch (e) { onToast('❌ ' + e.message, 'error'); }
  };

  const filtered = users.filter(u =>
    (roleFilter === 'ALL' || u.role === roleFilter) &&
    (u.name?.toLowerCase().includes(search.toLowerCase()) ||
     u.phone?.includes(search) ||
     u.entityName?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name, phone or entity..."
          style={{ padding:'8px 14px', borderRadius:'9px', border:`1.5px solid ${RC.crimsonLight}`,
            fontSize:'13px', outline:'none', flex:1, minWidth:'180px' }} />
        {['ALL','HOSPITAL','BLOOD_BANK','RIDER'].map(r => (
          <button key={r} onClick={() => setRF(r)}
            style={{ padding:'6px 14px', borderRadius:'20px', fontSize:'12px', fontWeight:700,
              border:'1.5px solid', cursor:'pointer',
              backgroundColor: roleFilter===r ? RC.crimson : '#fff',
              color: roleFilter===r ? '#fff' : RC.crimson,
              borderColor: roleFilter===r ? RC.crimsonDark : RC.crimsonLight }}>
            {r}
          </button>
        ))}
        <button onClick={load} style={{ padding:'6px 14px', borderRadius:'9px', fontSize:'12px',
          fontWeight:700, backgroundColor: RC.greenLight, color: RC.greenDark,
          border:`1px solid ${RC.greenMid}`, cursor:'pointer' }}>↻</button>
      </div>
      <p style={{ fontSize:'12px', color: RC.textMuted, marginBottom:'10px' }}>{total} total users</p>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color: RC.textMuted }}>Loading...</div>
      ) : (
        <RCCard variant="white" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ backgroundColor: RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}` }}>
                {['Name','Phone','Role','Entity','Location','Status','Action'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px',
                    fontSize:'11px', fontWeight:900, color: RC.crimson }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const rc = ROLE_COLOR[u.role] || { bg:'#F5F5F5', color: RC.textMid };
                return (
                  <tr key={u.id} style={{ backgroundColor: i%2===0?'#fff':RC.pinkSoft, borderBottom:'1px solid #F5E0E8' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600, color: RC.textDark }}>{u.name||'—'}</td>
                    <td style={{ padding:'10px 14px', color: RC.textMid }}>{u.phone}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'20px',
                        backgroundColor: rc.bg, color: rc.color }}>{u.role}</span>
                    </td>
                    <td style={{ padding:'10px 14px', color: RC.textMid, maxWidth:'120px',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {u.entityName||'—'}
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:'11px', color: RC.textMuted }}>
                      {u.latitude ? `${parseFloat(u.latitude).toFixed(2)}, ${parseFloat(u.longitude).toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'20px',
                        backgroundColor: u.active ? RC.greenLight : '#F5F5F5',
                        color: u.active ? RC.greenDark : RC.textMuted }}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      {u.role !== 'ADMIN' && u.active && (
                        <button onClick={() => deactivate(u.id, u.name||u.phone)}
                          style={{ fontSize:'11px', fontWeight:700, color: RC.crimson,
                            background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ borderTop:`1px solid ${RC.crimsonLight}` }}>
            <Pagination page={page} total={total} size={PAGE} onChange={setPage} />
          </div>
        </RCCard>
      )}
    </div>
  );
}

/* ── Requests Tab ─────────────────────────────────────────────── */
function RequestsTab({ onToast }) {
  const [requests, setReqs]   = useState([]);
  const [total,    setTotal]  = useState(0);
  const [page,     setPage]   = useState(0);
  const [loading,  setLoad]   = useState(true);
  const [filter,   setFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const r = await apiFetch(`/admin/requests?page=${page}&size=${PAGE}`);
      setReqs(r.content||[]); setTotal(r.totalElements||0);
    } catch (e) { onToast('Failed to load requests: ' + e.message, 'error'); }
    finally { setLoad(false); }
  }, [page, onToast]);
  useEffect(() => { load(); }, [load]);

  const FILTERS = ['ALL','PENDING','ACCEPTED','ASSIGNED','IN_TRANSIT','DELIVERED','REJECTED','CANCELLED'];
  const filtered = filter==='ALL' ? requests : requests.filter(r => r.status===filter);

  return (
    <div>
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px', alignItems:'center' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'4px 11px', borderRadius:'20px', fontSize:'11px', fontWeight:700,
              border:'1.5px solid', cursor:'pointer',
              backgroundColor: filter===f ? RC.crimson : '#fff',
              color: filter===f ? '#fff' : RC.crimson,
              borderColor: filter===f ? RC.crimsonDark : RC.crimsonLight }}>
            {f}
          </button>
        ))}
        <button onClick={load} style={{ marginLeft:'auto', padding:'5px 12px', borderRadius:'8px',
          fontSize:'12px', fontWeight:700, backgroundColor: RC.greenLight,
          color: RC.greenDark, border:`1px solid ${RC.greenMid}`, cursor:'pointer' }}>↻</button>
      </div>
      <p style={{ fontSize:'12px', color: RC.textMuted, marginBottom:'10px' }}>{total} total requests</p>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color: RC.textMuted }}>Loading...</div>
      ) : (
        <RCCard variant="white" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ backgroundColor: RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}` }}>
                {['#','Patient','Blood','Qty','Hospital','Blood Bank','Rider','Urgency','Status'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'9px 12px',
                    fontSize:'11px', fontWeight:900, color: RC.crimson }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i%2===0?'#fff':RC.pinkSoft, borderBottom:'1px solid #F5E0E8' }}>
                  <td style={{ padding:'9px 12px', color: RC.textMuted, fontSize:'11px' }}>#{r.id}</td>
                  <td style={{ padding:'9px 12px', fontWeight:600, color: RC.textDark }}>{r.patientName||'—'}</td>
                  <td style={{ padding:'9px 12px', fontWeight:900, color: RC.crimson }}>{r.bloodGroup}</td>
                  <td style={{ padding:'9px 12px', color: RC.textMid }}>{r.quantity}</td>
                  <td style={{ padding:'9px 12px', color: RC.textMid, maxWidth:'100px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.hospitalName||'—'}</td>
                  <td style={{ padding:'9px 12px', color: RC.textMid, maxWidth:'100px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.bloodBankName||'—'}</td>
                  <td style={{ padding:'9px 12px', color: RC.textMid }}>{r.riderName||'—'}</td>
                  <td style={{ padding:'9px 12px' }}>
                    {r.urgency==='URGENT'
                      ? <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 7px', borderRadius:'20px',
                          backgroundColor: RC.pinkBg, color: RC.crimson }}>🚨 Urgent</span>
                      : <span style={{ fontSize:'11px', color: RC.textMuted }}>Normal</span>}
                  </td>
                  <td style={{ padding:'9px 12px' }}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop:`1px solid ${RC.crimsonLight}` }}>
            <Pagination page={page} total={total} size={PAGE} onChange={setPage} />
          </div>
        </RCCard>
      )}
    </div>
  );
}

/* ── Inventory Tab ────────────────────────────────────────────── */
function InventoryTab({ onToast }) {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`/inventory?page=${page}&size=${PAGE}`);
      setItems(d.content||[]); setTotal(d.totalElements||0);
    } catch (e) { onToast('Failed to load inventory: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }, [page, onToast]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <p style={{ margin:0, fontSize:'12px', color: RC.textMuted }}>{total} total inventory records</p>
        <button onClick={load} style={{ padding:'6px 14px', borderRadius:'9px', fontSize:'12px',
          fontWeight:700, backgroundColor: RC.greenLight, color: RC.greenDark,
          border:`1px solid ${RC.greenMid}`, cursor:'pointer' }}>↻ Refresh</button>
      </div>
      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color: RC.textMuted }}>Loading...</div>
      ) : (
        <RCCard variant="white" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ backgroundColor: RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}` }}>
                {['Blood Bank','Blood Group','Category','Qty','Collected','Expiry'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px',
                    fontSize:'11px', fontWeight:900, color: RC.crimson }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const expired = item.expiryDate && new Date(item.expiryDate) < new Date();
                return (
                  <tr key={item.id} style={{ backgroundColor: i%2===0?'#fff':RC.pinkSoft, borderBottom:'1px solid #F5E0E8' }}>
                    <td style={{ padding:'10px 14px', fontWeight:600, color: RC.textDark }}>{item.location||'—'}</td>
                    <td style={{ padding:'10px 14px', fontWeight:900, color: RC.crimson }}>{item.bloodGroup}</td>
                    <td style={{ padding:'10px 14px', color: RC.textMid }}>{item.category}</td>
                    <td style={{ padding:'10px 14px', fontWeight:700, color: RC.textDark }}>{item.quantity}</td>
                    <td style={{ padding:'10px 14px', color: RC.textMuted }}>{item.collectionDate||'—'}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 7px', borderRadius:'20px',
                        backgroundColor: expired ? RC.pinkBg : RC.greenLight,
                        color: expired ? RC.crimson : RC.greenDark }}>
                        {item.expiryDate || '—'}
                        {expired && ' ⚠ Expired'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ borderTop:`1px solid ${RC.crimsonLight}` }}>
            <Pagination page={page} total={total} size={PAGE} onChange={setPage} />
          </div>
        </RCCard>
      )}
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function AdminDashboard({ onLogout }) {
  const [tab,     setTab]     = useState('analytics');
  const [summary, setSummary] = useState(null);
  const [sumLoad, setSumLoad] = useState(true);
  const [toast,   setToast]   = useState(null);
  const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);

  const loadSummary = useCallback(async () => {
    setSumLoad(true);
    try {
      const s = await apiFetch('/admin/reports/requests-summary');
      setSummary(s);
    } catch (e) { showToast('Failed to load analytics: ' + e.message, 'error'); }
    finally { setSumLoad(false); }
  }, [showToast]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor: RC.pinkSoft }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
      <RCSidebar role="ADMIN" entityName="Super Admin" tabs={TABS}
        activeTab={tab} onTabChange={setTab} onLogout={onLogout} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <PageHeader title={`${TABS.find(t=>t.key===tab)?.icon} ${TABS.find(t=>t.key===tab)?.label}`} />
        <main style={{ flex:1, padding:'24px 28px', overflowY:'auto' }}>
          {tab === 'analytics' && <AnalyticsTab summary={summary} loading={sumLoad} />}
          {tab === 'users'     && <UsersTab onToast={showToast} />}
          {tab === 'requests'  && <RequestsTab onToast={showToast} />}
          {tab === 'inventory' && <InventoryTab onToast={showToast} />}
        </main>
      </div>
    </div>
  );
}
