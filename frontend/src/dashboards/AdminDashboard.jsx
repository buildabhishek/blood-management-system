import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/api';
import RCSidebar from '../components/RCSidebar';
import RCToast   from '../components/RCToast';
import RCCard    from '../components/RCCard';
import { RC }    from '../components/RCTheme';

const TABS = [
  { key:'overview',  icon:'📊', label:'Overview'    },
  { key:'hospitals', icon:'🏥', label:'Hospitals'   },
  { key:'banks',     icon:'🩸', label:'Blood Banks' },
  { key:'riders',    icon:'🏍', label:'Riders'      },
  { key:'requests',  icon:'📋', label:'All Requests'},
  { key:'users',     icon:'👥', label:'All Users'   },
  { key:'add-user',  icon:'➕', label:'Add User'    },
];

const SI = (err, extra={}) => ({
  width:'100%', padding:'9px 13px', borderRadius:'9px',
  border:`1.5px solid ${err?RC.crimson:'#E0E0E0'}`,
  fontSize:'13px', color:RC.textDark, outline:'none', boxSizing:'border-box', ...extra,
});

function Badge({ status }) {
  const m = {
    PENDING:    { bg:RC.cardYellow, c:'#E65100' },
    ACCEPTED:   { bg:RC.greenLight, c:RC.greenDark },
    REJECTED:   { bg:RC.pinkBg,    c:RC.crimson },
    CANCELLED:  { bg:'#F5F5F5',    c:'#888' },
    ASSIGNED:   { bg:'#EDE7F6',    c:'#512DA8' },
    IN_TRANSIT: { bg:RC.cardBlue,  c:'#1565C0' },
    DELIVERED:  { bg:RC.greenLight, c:RC.greenDark },
  };
  const s = m[status]||{ bg:'#F5F5F5', c:RC.textMid };
  return (
    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px',
      backgroundColor:s.bg, color:s.c, whiteSpace:'nowrap' }}>
      {status?.replace('_',' ')}
    </span>
  );
}

function RoleBadge({ role }) {
  const m = {
    ADMIN:      { bg:'#FCE4EC', c:'#880E4F' },
    HOSPITAL:   { bg:RC.cardBlue,  c:'#1565C0' },
    BLOOD_BANK: { bg:RC.pinkBg,    c:RC.crimson },
    RIDER:      { bg:'#EDE7F6',    c:'#512DA8' },
    DONOR:      { bg:RC.greenLight,c:RC.greenDark },
  };
  const s = m[role]||{ bg:'#F5F5F5', c:RC.textMid };
  return (
    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px',
      backgroundColor:s.bg, color:s.c }}>
      {role}
    </span>
  );
}

// ── Overview / Analytics ──────────────────────────────────────────────────────
function OverviewTab() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/admin/reports/summary')
      .then(d => setSummary(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'60px', color:RC.textMuted }}>Loading…</div>;
  if (!summary) return <div style={{ padding:'30px', color:RC.crimson }}>Failed to load summary.</div>;

  const total   = summary.totalRequests || 0;
  const statuses = [
    { key:'pending',   label:'Pending',     color:'#E65100', bg:RC.cardYellow },
    { key:'accepted',  label:'Accepted',    color:RC.greenDark, bg:RC.greenLight },
    { key:'assigned',  label:'Assigned',    color:'#512DA8', bg:'#EDE7F6' },
    { key:'inTransit', label:'In Transit',  color:'#1565C0', bg:RC.cardBlue },
    { key:'delivered', label:'Delivered',   color:RC.greenDark, bg:RC.greenLight },
    { key:'rejected',  label:'Rejected',    color:RC.crimson, bg:RC.pinkBg },
    { key:'cancelled', label:'Cancelled',   color:'#888',    bg:'#F5F5F5' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {/* Entity counts */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px' }}>
        {[
          { label:'Total Hospitals',   value:summary.totalHospitals,  icon:'🏥', bg:RC.cardBlue,   c:'#1565C0',  bd:'#90CAF9' },
          { label:'Blood Banks',       value:summary.totalBloodBanks, icon:'🩸', bg:RC.pinkBg,     c:RC.crimson, bd:RC.crimsonLight },
          { label:'Active Riders',     value:summary.totalRiders,     icon:'🏍', bg:'#EDE7F6',     c:'#512DA8',  bd:'#9C27B0' },
          { label:'Total Users',       value:summary.totalUsers,      icon:'👥', bg:RC.cardYellow, c:'#E65100',  bd:'#FFD54F' },
        ].map(k => (
          <div key={k.label} style={{ borderRadius:'14px', padding:'18px', textAlign:'center',
            backgroundColor:k.bg, border:`2px solid ${k.bd}` }}>
            <div style={{ fontSize:'28px', marginBottom:'6px' }}>{k.icon}</div>
            <div style={{ fontSize:'30px', fontWeight:900, color:k.c }}>{k.value ?? '—'}</div>
            <div style={{ fontSize:'12px', fontWeight:600, color:RC.textMid, marginTop:'4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Requests summary bar */}
      <RCCard variant="white" style={{ padding:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <p style={{ margin:0, fontWeight:900, fontSize:'14px', color:RC.textMid }}>
            BLOOD REQUESTS OVERVIEW
          </p>
          <span style={{ fontWeight:900, fontSize:'22px', color:RC.crimson }}>{total} Total</span>
        </div>

        {total > 0 && (
          <div style={{ height:'28px', borderRadius:'14px', overflow:'hidden', display:'flex', marginBottom:'16px' }}>
            {statuses.filter(s => (summary[s.key]||0) > 0).map(s => (
              <div key={s.key} title={`${s.label}: ${summary[s.key]}`}
                style={{ flex: summary[s.key], backgroundColor:s.color, transition:'flex 0.4s', minWidth:'4px' }} />
            ))}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
          {statuses.map(s => (
            <div key={s.key} style={{ padding:'10px 12px', borderRadius:'10px',
              backgroundColor:s.bg, textAlign:'center' }}>
              <div style={{ fontSize:'22px', fontWeight:900, color:s.color }}>{summary[s.key]??0}</div>
              <div style={{ fontSize:'11px', fontWeight:600, color:RC.textMid, marginTop:'2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </RCCard>

      {/* Inventory summary */}
      <RCCard variant="white" style={{ padding:'20px' }}>
        <p style={{ margin:'0 0 12px', fontWeight:900, fontSize:'14px', color:RC.textMid }}>
          PLATFORM HEALTH
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
          {[
            { label:'Inventory Records', value:summary.totalInventoryRecords ?? 0, bg:RC.cardBlue, c:'#1565C0', bd:'#90CAF9' },
            { label:'Fulfilled Rate', value: total > 0 ? `${((summary.delivered/total)*100).toFixed(1)}%` : '—', bg:RC.greenLight, c:RC.greenDark, bd:RC.greenMid },
            { label:'Active Deliveries', value:(summary.assigned||0)+(summary.inTransit||0), bg:'#EDE7F6', c:'#512DA8', bd:'#9C27B0' },
          ].map(k => (
            <div key={k.label} style={{ borderRadius:'12px', padding:'14px', textAlign:'center',
              backgroundColor:k.bg, border:`1.5px solid ${k.bd}` }}>
              <div style={{ fontSize:'24px', fontWeight:900, color:k.c }}>{k.value}</div>
              <div style={{ fontSize:'11px', fontWeight:600, color:RC.textMid, marginTop:'3px' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </RCCard>
    </div>
  );
}

// ── Entity List Tab (Hospitals / Blood Banks / Riders) ────────────────────────
function EntityTab({ type, onToast }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [deacting,setDeacting]= useState(null);

  const endpoints = { hospitals:'/admin/hospitals', banks:'/admin/blood-banks', riders:'/admin/riders' };

  const load = () => {
    apiFetch(endpoints[type])
      .then(d => setItems(d||[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [type]);

  const deactivate = async id => {
    if (!window.confirm('Deactivate this user?')) return;
    setDeacting(id);
    try {
      await apiFetch(`/admin/users/${id}`, { method:'DELETE' });
      onToast('User deactivated.'); load();
    } catch(e) { onToast('❌ '+e.message,'error'); }
    finally { setDeacting(null); }
  };

  const activate = async id => {
    try {
      await apiFetch(`/admin/users/${id}/activate`, { method:'PUT' });
      onToast('User activated.'); load();
    } catch(e) { onToast('❌ '+e.message,'error'); }
  };

  const filtered = items.filter(u =>
    (u.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.entityName||'').toLowerCase().includes(search.toLowerCase()) ||
    (u.phone||'').includes(search)
  );

  const labels = { hospitals:'🏥 Hospitals', banks:'🩸 Blood Banks', riders:'🏍 Riders' };

  return (
    <div>
      <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'16px', flexWrap:'wrap' }}>
        <h3 style={{ margin:0, fontWeight:900, color:RC.textDark, fontSize:'16px' }}>
          {labels[type]} ({items.length})
        </h3>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search name, entity or phone…"
          style={{ ...SI(false), flex:1, maxWidth:'280px' }} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:RC.textMuted }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <RCCard variant="green" style={{ padding:'30px', textAlign:'center' }}>
          <p style={{ fontWeight:700, color:RC.greenDark, margin:0 }}>No records found.</p>
        </RCCard>
      ) : (
        <RCCard variant="white" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ backgroundColor:RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}` }}>
                {['ID','Name','Entity','Phone','Address','Zone/Vehicle','Status','Actions'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'9px 12px',
                    fontSize:'11px', fontWeight:900, color:RC.crimson, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ backgroundColor:i%2===0?'#fff':RC.pinkSoft,
                  borderBottom:'1px solid #F5E0E8', opacity: u.active===false ? 0.5 : 1 }}>
                  <td style={{ padding:'9px 12px', fontSize:'11px', color:RC.textMuted }}>{u.id}</td>
                  <td style={{ padding:'9px 12px', fontWeight:700, color:RC.textDark }}>{u.name}</td>
                  <td style={{ padding:'9px 12px', color:RC.textMid, maxWidth:'140px', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.entityName||'—'}</td>
                  <td style={{ padding:'9px 12px', color:RC.textMid }}>{u.phone}</td>
                  <td style={{ padding:'9px 12px', color:RC.textMuted, maxWidth:'120px', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.address||'—'}</td>
                  <td style={{ padding:'9px 12px', color:RC.textMuted, fontSize:'12px' }}>
                    {u.assignedZone || u.vehicleType || '—'}
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'20px',
                      backgroundColor: u.active!==false ? RC.greenLight : RC.pinkBg,
                      color: u.active!==false ? RC.greenDark : RC.crimson }}>
                      {u.active!==false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    {u.active !== false ? (
                      <button onClick={()=>deactivate(u.id)} disabled={deacting===u.id}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:700,
                          backgroundColor:RC.pinkBg, color:RC.crimson, border:'none', cursor:'pointer' }}>
                        {deacting===u.id?'…':'Deactivate'}
                      </button>
                    ) : (
                      <button onClick={()=>activate(u.id)}
                        style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:700,
                          backgroundColor:RC.greenLight, color:RC.greenDark, border:'none', cursor:'pointer' }}>
                        Activate
                      </button>
                    )}
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

// ── All Requests Tab ──────────────────────────────────────────────────────────
function AllRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(0);
  const [total,    setTotal]    = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`/admin/requests?page=${page}&size=${PAGE_SIZE}`);
      setRequests(d?.content || []);
      setTotal(d?.totalElements || 0);
    } catch { setRequests([]); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const statuses = ['ALL','PENDING','ACCEPTED','ASSIGNED','IN_TRANSIT','DELIVERED','REJECTED','CANCELLED'];
  const filtered = requests.filter(r => {
    const sf = filter === 'ALL' || r.status === filter;
    const sc = !search || (r.patientName||'').toLowerCase().includes(search.toLowerCase())
      || (r.hospitalName||'').toLowerCase().includes(search.toLowerCase())
      || (r.bloodBankName||'').toLowerCase().includes(search.toLowerCase());
    return sf && sc;
  });

  return (
    <div>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search patient, hospital, bank…"
          style={{ ...SI(false), width:'230px', flex:'none' }} />
        <button onClick={load} style={{ padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:700,
          backgroundColor:RC.greenLight, color:RC.greenDark, border:`1px solid ${RC.greenMid}`, cursor:'pointer' }}>
          ↻ Refresh
        </button>
        <span style={{ fontSize:'11px', color:RC.textMuted, marginLeft:'auto' }}>
          {total} total · Page {page+1}
        </span>
      </div>
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'14px' }}>
        {statuses.map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:700,
              border:'1.5px solid', cursor:'pointer',
              backgroundColor: filter===f ? RC.crimson : '#fff',
              color: filter===f ? '#fff' : RC.crimson,
              borderColor: filter===f ? RC.crimsonDark : RC.crimsonLight }}>{f}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px', color:RC.textMuted }}>Loading…</div>
       : filtered.length === 0 ? (
        <RCCard variant="green" style={{ padding:'30px', textAlign:'center' }}>
          <p style={{ fontWeight:700, color:RC.greenDark, margin:0 }}>No requests found.</p>
        </RCCard>
       ) : (
        <RCCard variant="white" style={{ overflow:'hidden', marginBottom:'14px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ backgroundColor:RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}` }}>
                {['#','Patient','Blood','Qty','Urgency','Hospital','Blood Bank','Rider','Status','Date'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'8px 10px',
                    fontSize:'10px', fontWeight:900, color:RC.crimson, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor:i%2===0?'#fff':RC.pinkSoft,
                  borderBottom:'1px solid #F5E0E8' }}>
                  <td style={{ padding:'8px 10px', color:RC.textMuted, fontSize:'10px' }}>#{r.id}</td>
                  <td style={{ padding:'8px 10px', fontWeight:600, color:RC.textDark, maxWidth:'100px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.patientName}</td>
                  <td style={{ padding:'8px 10px', fontWeight:900, color:RC.crimson }}>{r.bloodGroup}</td>
                  <td style={{ padding:'8px 10px', color:RC.textMid }}>{r.quantity}</td>
                  <td style={{ padding:'8px 10px' }}>
                    {r.urgency==='CRITICAL'
                      ? <span style={{ fontSize:'10px', fontWeight:900, color:RC.crimson }}>🚨 CRITICAL</span>
                      : r.urgency==='URGENT'
                      ? <span style={{ fontSize:'10px', fontWeight:700, color:'#E65100' }}>⚡ URGENT</span>
                      : <span style={{ fontSize:'10px', color:RC.textMuted }}>Normal</span>}
                  </td>
                  <td style={{ padding:'8px 10px', color:RC.textMid, maxWidth:'100px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.hospitalName||'—'}</td>
                  <td style={{ padding:'8px 10px', color:RC.textMid, maxWidth:'100px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.bloodBankName||'—'}</td>
                  <td style={{ padding:'8px 10px', color:RC.textMid }}>{r.riderName||'—'}</td>
                  <td style={{ padding:'8px 10px' }}><Badge status={r.status} /></td>
                  <td style={{ padding:'8px 10px', color:RC.textMuted, fontSize:'10px', whiteSpace:'nowrap' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </RCCard>
       )}

      {/* Pagination */}
      <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
          style={{ padding:'6px 16px', borderRadius:'8px', fontWeight:700, fontSize:'12px',
            backgroundColor: page===0?'#F5F5F5':RC.crimson, color:page===0?RC.textMuted:'#fff',
            border:'none', cursor:page===0?'not-allowed':'pointer' }}>← Prev</button>
        <span style={{ padding:'6px 14px', fontSize:'12px', color:RC.textMid, fontWeight:600 }}>
          Page {page+1} of {Math.ceil(total/PAGE_SIZE)||1}
        </span>
        <button onClick={()=>setPage(p=>p+1)} disabled={(page+1)*PAGE_SIZE>=total}
          style={{ padding:'6px 16px', borderRadius:'8px', fontWeight:700, fontSize:'12px',
            backgroundColor:(page+1)*PAGE_SIZE>=total?'#F5F5F5':RC.crimson,
            color:(page+1)*PAGE_SIZE>=total?RC.textMuted:'#fff',
            border:'none', cursor:(page+1)*PAGE_SIZE>=total?'not-allowed':'pointer' }}>Next →</button>
      </div>
    </div>
  );
}

// ── All Users Tab ─────────────────────────────────────────────────────────────
function AllUsersTab({ onToast }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleF,   setRoleF]   = useState('ALL');
  const [page,    setPage]    = useState(0);
  const [total,   setTotal]   = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch(`/admin/users?page=${page}&size=${PAGE_SIZE}`);
      setUsers(d?.content || []);
      setTotal(d?.totalElements || 0);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const deactivate = async id => {
    if (!window.confirm('Deactivate this user?')) return;
    try { await apiFetch(`/admin/users/${id}`,{method:'DELETE'}); onToast('User deactivated.'); load(); }
    catch(e) { onToast('❌ '+e.message,'error'); }
  };

  const activate = async id => {
    try { await apiFetch(`/admin/users/${id}/activate`,{method:'PUT'}); onToast('User activated.'); load(); }
    catch(e) { onToast('❌ '+e.message,'error'); }
  };

  const filtered = users.filter(u => {
    const rf = roleF==='ALL' || u.role===roleF;
    const sf = !search || (u.name||'').toLowerCase().includes(search.toLowerCase())
      || (u.phone||'').includes(search) || (u.entityName||'').toLowerCase().includes(search.toLowerCase());
    return rf && sf;
  });

  return (
    <div>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'14px', alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Search name, phone, entity…"
          style={{ ...SI(false), width:'220px', flex:'none' }} />
        <select value={roleF} onChange={e=>setRoleF(e.target.value)} style={{ ...SI(false), width:'130px', flex:'none' }}>
          <option value="ALL">All Roles</option>
          {['ADMIN','HOSPITAL','BLOOD_BANK','RIDER','DONOR'].map(r=><option key={r}>{r}</option>)}
        </select>
        <button onClick={load} style={{ padding:'6px 14px', borderRadius:'8px', fontSize:'12px', fontWeight:700,
          backgroundColor:RC.greenLight, color:RC.greenDark, border:`1px solid ${RC.greenMid}`, cursor:'pointer' }}>
          ↻ Refresh
        </button>
        <span style={{ fontSize:'11px', color:RC.textMuted, marginLeft:'auto' }}>
          {total} total · Page {page+1}
        </span>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'40px', color:RC.textMuted }}>Loading…</div>
       : filtered.length===0 ? (
        <RCCard variant="green" style={{ padding:'30px', textAlign:'center' }}>
          <p style={{ fontWeight:700, color:RC.greenDark, margin:0 }}>No users found.</p>
        </RCCard>
       ) : (
        <RCCard variant="white" style={{ overflow:'hidden', marginBottom:'14px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
            <thead>
              <tr style={{ backgroundColor:RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}` }}>
                {['ID','Name','Role','Entity','Phone','Joined','Status','Actions'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:'10px', fontWeight:900, color:RC.crimson }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u,i)=>(
                <tr key={u.id} style={{ backgroundColor:i%2===0?'#fff':RC.pinkSoft,
                  borderBottom:'1px solid #F5E0E8', opacity: u.active===false?0.55:1 }}>
                  <td style={{ padding:'8px 10px', color:RC.textMuted, fontSize:'10px' }}>{u.id}</td>
                  <td style={{ padding:'8px 10px', fontWeight:600, color:RC.textDark }}>{u.name}</td>
                  <td style={{ padding:'8px 10px' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding:'8px 10px', color:RC.textMuted, maxWidth:'100px', overflow:'hidden',
                    textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.entityName||'—'}</td>
                  <td style={{ padding:'8px 10px', color:RC.textMid }}>{u.phone}</td>
                  <td style={{ padding:'8px 10px', color:RC.textMuted, fontSize:'10px' }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px',
                      backgroundColor: u.active!==false?RC.greenLight:RC.pinkBg,
                      color: u.active!==false?RC.greenDark:RC.crimson }}>
                      {u.active!==false?'Active':'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    {u.role !== 'ADMIN' && (
                      u.active !== false
                        ? <button onClick={()=>deactivate(u.id)} style={{ padding:'3px 9px', borderRadius:'6px',
                            fontSize:'10px', fontWeight:700, backgroundColor:RC.pinkBg, color:RC.crimson,
                            border:'none', cursor:'pointer' }}>Deactivate</button>
                        : <button onClick={()=>activate(u.id)} style={{ padding:'3px 9px', borderRadius:'6px',
                            fontSize:'10px', fontWeight:700, backgroundColor:RC.greenLight, color:RC.greenDark,
                            border:'none', cursor:'pointer' }}>Activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </RCCard>
       )}

      <div style={{ display:'flex', gap:'8px', justifyContent:'center' }}>
        <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
          style={{ padding:'6px 16px', borderRadius:'8px', fontWeight:700, fontSize:'12px',
            backgroundColor:page===0?'#F5F5F5':RC.crimson, color:page===0?RC.textMuted:'#fff', border:'none',
            cursor:page===0?'not-allowed':'pointer' }}>← Prev</button>
        <span style={{ padding:'6px 14px', fontSize:'12px', color:RC.textMid, fontWeight:600 }}>
          Page {page+1} of {Math.ceil(total/PAGE_SIZE)||1}
        </span>
        <button onClick={()=>setPage(p=>p+1)} disabled={(page+1)*PAGE_SIZE>=total}
          style={{ padding:'6px 16px', borderRadius:'8px', fontWeight:700, fontSize:'12px',
            backgroundColor:(page+1)*PAGE_SIZE>=total?'#F5F5F5':RC.crimson,
            color:(page+1)*PAGE_SIZE>=total?RC.textMuted:'#fff', border:'none',
            cursor:(page+1)*PAGE_SIZE>=total?'not-allowed':'pointer' }}>Next →</button>
      </div>
    </div>
  );
}

// ── Add User Tab ──────────────────────────────────────────────────────────────
function AddUserTab({ onToast }) {
  const [form, setForm] = useState({
    name:'', phone:'', password:'', role:'HOSPITAL', entityName:'',
    address:'', latitude:'', longitude:'', vehicleType:'', vehiclePlate:'', assignedZone:'',
  });
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Required, min 2 chars.';
    if (!/^[0-9]{10,15}$/.test(form.phone.trim()))       e.phone = 'Must be 10–15 digits.';
    if (!form.password || form.password.length < 6)       e.password = 'Min 6 characters.';
    if ((form.role==='HOSPITAL'||form.role==='BLOOD_BANK') && !form.entityName.trim())
      e.entityName = 'Required for this role.';
    return e;
  };

  const submit = async () => {
    const e = validate(); setErrors(e); setSuccess('');
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      await apiFetch('/admin/users', { method:'POST', body: JSON.stringify({
        name: form.name.trim(), phone: form.phone.trim(), password: form.password, role: form.role,
        entityName: form.entityName.trim()||null, address: form.address.trim()||null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        vehicleType: form.vehicleType||null, vehiclePlate: form.vehiclePlate||null,
        assignedZone: form.assignedZone||null,
      }) });
      setSuccess(`✅ ${form.role} account created for ${form.name}!`);
      onToast('User created successfully.');
      setForm({ name:'', phone:'', password:'', role:'HOSPITAL', entityName:'',
        address:'', latitude:'', longitude:'', vehicleType:'', vehiclePlate:'', assignedZone:'' });
      setErrors({});
    } catch(e) { onToast('❌ '+e.message,'error'); setErrors({ submit: e.message }); }
    finally { setSaving(false); }
  };

  const F = ({label, err, children, required}) => (
    <div>
      <label style={{ fontSize:'11px', fontWeight:700, display:'block', marginBottom:'5px', color:RC.textMid }}>
        {label} {required && <span style={{ color:RC.crimson }}>*</span>}
      </label>
      {children}
      {err && <p style={{ margin:'3px 0 0', fontSize:'11px', color:RC.crimson, fontWeight:600 }}>⚠ {err}</p>}
    </div>
  );

  const ROLES = [
    { value:'HOSPITAL',   label:'Hospital',   icon:'🏥' },
    { value:'BLOOD_BANK', label:'Blood Bank', icon:'🩸' },
    { value:'RIDER',      label:'Rider',       icon:'🏍' },
    { value:'ADMIN',      label:'Admin',       icon:'⚙️' },
  ];

  return (
    <div style={{ maxWidth:'560px' }}>
      <RCCard variant="white" style={{ padding:'24px' }}>
        <h3 style={{ margin:'0 0 18px', fontWeight:900, fontSize:'16px', color:RC.crimson }}>
          Create New User Account
        </h3>

        {/* Role selector */}
        <div style={{ marginBottom:'18px' }}>
          <label style={{ fontSize:'11px', fontWeight:700, display:'block', marginBottom:'8px', color:RC.textMid }}>
            Role <span style={{ color:RC.crimson }}>*</span>
          </label>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px' }}>
            {ROLES.map(r => (
              <button key={r.value} type="button"
                onClick={() => { setForm(f=>({...f,role:r.value})); setErrors({}); }}
                style={{ padding:'10px 6px', borderRadius:'10px', border:'2px solid', cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
                  fontSize:'12px', fontWeight:600, transition:'all 0.15s',
                  backgroundColor: form.role===r.value ? RC.crimson : '#fff',
                  color: form.role===r.value ? '#fff' : RC.textMid,
                  borderColor: form.role===r.value ? RC.crimsonDark : '#E0E0E0' }}>
                <span style={{ fontSize:'18px' }}>{r.icon}</span>{r.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <F label="Full Name" err={errors.name} required>
              <input value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setErrors(er=>({...er,name:''}));}}
                placeholder="Full name" style={SI(errors.name)} />
            </F>
            <F label="Phone" err={errors.phone} required>
              <input value={form.phone} onChange={e=>{setForm(f=>({...f,phone:e.target.value}));setErrors(er=>({...er,phone:''}));}}
                placeholder="10-digit mobile" inputMode="numeric" style={SI(errors.phone)} />
            </F>
          </div>

          <F label="Password" err={errors.password} required>
            <input type="password" value={form.password} onChange={e=>{setForm(f=>({...f,password:e.target.value}));setErrors(er=>({...er,password:''}));}}
              placeholder="Min 6 characters" style={SI(errors.password)} />
          </F>

          {(form.role==='HOSPITAL'||form.role==='BLOOD_BANK') && (
            <>
              <F label={form.role==='HOSPITAL'?'Hospital Name':'Blood Bank Name'} err={errors.entityName} required>
                <input value={form.entityName} onChange={e=>{setForm(f=>({...f,entityName:e.target.value}));setErrors(er=>({...er,entityName:''}));}}
                  placeholder="Official registered name" style={SI(errors.entityName)} />
              </F>
              <F label="Address">
                <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}
                  placeholder="Full address" style={SI(false)} />
              </F>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <F label="Latitude">
                  <input type="number" step="any" value={form.latitude}
                    onChange={e=>setForm(f=>({...f,latitude:e.target.value}))}
                    placeholder="e.g. 19.0760" style={SI(false)} />
                </F>
                <F label="Longitude">
                  <input type="number" step="any" value={form.longitude}
                    onChange={e=>setForm(f=>({...f,longitude:e.target.value}))}
                    placeholder="e.g. 72.8777" style={SI(false)} />
                </F>
              </div>
              <p style={{ fontSize:'11px', color:RC.textMuted, margin:0 }}>
                📍 Coordinates enable distance-based hospital search
              </p>
            </>
          )}

          {form.role==='RIDER' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <F label="Vehicle Type">
                  <select value={form.vehicleType} onChange={e=>setForm(f=>({...f,vehicleType:e.target.value}))} style={SI(false)}>
                    <option value="">Select</option>
                    {['Motorcycle','Scooter','Car','Van'].map(v=><option key={v}>{v}</option>)}
                  </select>
                </F>
                <F label="Vehicle Plate">
                  <input value={form.vehiclePlate} onChange={e=>setForm(f=>({...f,vehiclePlate:e.target.value}))}
                    placeholder="MH 02 AB 1234" style={SI(false)} />
                </F>
              </div>
              <F label="Assigned Zone">
                <input value={form.assignedZone} onChange={e=>setForm(f=>({...f,assignedZone:e.target.value}))}
                  placeholder="e.g. Dombivli, Thane" style={SI(false)} />
              </F>
            </>
          )}

          {success && (
            <div style={{ padding:'12px 16px', borderRadius:'10px', backgroundColor:RC.greenLight,
              border:`1.5px solid ${RC.greenMid}` }}>
              <p style={{ margin:0, fontWeight:700, fontSize:'13px', color:RC.greenDark }}>{success}</p>
            </div>
          )}

          {errors.submit && (
            <div style={{ padding:'12px 16px', borderRadius:'10px', backgroundColor:RC.pinkBg,
              border:`1.5px solid ${RC.crimson}` }}>
              <p style={{ margin:0, fontWeight:700, fontSize:'13px', color:RC.crimson }}>⚠ {errors.submit}</p>
            </div>
          )}

          <button onClick={submit} disabled={saving}
            style={{ padding:'12px', borderRadius:'12px', fontWeight:900, fontSize:'14px',
              border:'none', cursor: saving?'not-allowed':'pointer',
              backgroundColor: saving ? '#C0C0C0' : RC.crimson,
              color:'#fff', opacity: saving ? 0.7 : 1, marginTop:'4px' }}>
            {saving ? 'Creating…' : '➕ Create Account'}
          </button>
        </div>
      </RCCard>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard({ onLogout }) {
  const [tab,   setTab]   = useState('overview');
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:RC.pinkSoft }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
      <RCSidebar role="ADMIN" entityName="Super Admin" tabs={TABS}
        activeTab={tab} onTabChange={setTab} onLogout={onLogout} />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <div style={{ backgroundColor:RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}`,
          padding:'14px 28px' }}>
          <h2 style={{ margin:0, fontWeight:900, fontSize:'17px', color:RC.crimson }}>
            {TABS.find(t=>t.key===tab)?.icon} {TABS.find(t=>t.key===tab)?.label}
          </h2>
          <p style={{ margin:'2px 0 0', fontSize:'12px', color:RC.textMuted }}>
            RC Foundation — Admin Panel
          </p>
        </div>

        <main style={{ flex:1, padding:'24px 28px', overflowY:'auto' }}>
          {tab==='overview'  && <OverviewTab />}
          {tab==='hospitals' && <EntityTab type="hospitals" onToast={showToast} />}
          {tab==='banks'     && <EntityTab type="banks"     onToast={showToast} />}
          {tab==='riders'    && <EntityTab type="riders"    onToast={showToast} />}
          {tab==='requests'  && <AllRequestsTab />}
          {tab==='users'     && <AllUsersTab onToast={showToast} />}
          {tab==='add-user'  && <AddUserTab onToast={showToast} />}
        </main>
      </div>
    </div>
  );
}
