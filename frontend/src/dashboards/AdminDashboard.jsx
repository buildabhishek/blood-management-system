import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../api/api';
import RCSidebar from '../components/RCSidebar';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC } from '../components/RCTheme';

const TABS = [
  { key:'analytics', icon:'📊', label:'Analytics' },
  { key:'users',     icon:'👤', label:'Users'     },
  { key:'requests',  icon:'🩸', label:'Requests'  },
];

function PageHeader({ title }) {
  return (
    <div className="flex items-center px-8 py-4"
      style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}>
      <h2 className="font-black text-lg" style={{ color: RC.crimson }}>{title}</h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING:    { bg: RC.cardYellow, color:'#E65100' },
    ACCEPTED:   { bg: RC.greenLight, color: RC.greenDark },
    REJECTED:   { bg: RC.pinkBg,     color: RC.crimson },
    ASSIGNED:   { bg:'#EDE7F6',      color:'#512DA8' },
    IN_TRANSIT: { bg: RC.cardBlue,   color:'#1565C0' },
    DELIVERED:  { bg: RC.greenLight, color: RC.greenDark },
  };
  const s = map[status] || { bg:'#F5F5F5', color: RC.textMid };
  return (
    <span className="text-xs font-bold px-2 py-1 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>{status?.replace('_',' ')}</span>
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
    <div className="flex items-center justify-between mt-4 px-4">
      <span className="text-xs" style={{ color: RC.textMuted }}>
        Showing {page * size + 1}–{Math.min((page+1)*size, total)} of {total}
      </span>
      <div className="flex gap-2">
        <button disabled={page===0} onClick={() => onChange(page-1)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
          style={{ backgroundColor: RC.pinkBg, color: RC.crimson, border: `1.5px solid ${RC.crimsonLight}` }}>
          ← Prev
        </button>
        <span className="px-3 py-1.5 text-xs font-bold"
          style={{ color: RC.textMid }}>{page+1} / {pages}</span>
        <button disabled={page>=pages-1} onClick={() => onChange(page+1)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
          style={{ backgroundColor: RC.pinkBg, color: RC.crimson, border: `1.5px solid ${RC.crimsonLight}` }}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [tab, setTab]         = useState('analytics');
  const [users, setUsers]     = useState([]);
  const [requests, setReqs]   = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [userPage, setUPage]  = useState(0);
  const [reqPage,  setRPage]  = useState(0);
  const [userTotal, setUTotal]= useState(0);
  const [reqTotal,  setRTotal]= useState(0);
  const PAGE = 20;

  const showToast = (msg, type='success') => setToast({ msg, type });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r, s] = await Promise.all([
        apiFetch(`/admin/users?page=${userPage}&size=${PAGE}`),
        apiFetch(`/admin/requests?page=${reqPage}&size=${PAGE}`),
        apiFetch('/admin/reports/requests-summary'),
      ]);
      setUsers(u.content || []); setUTotal(u.totalElements || 0);
      setReqs(r.content  || []); setRTotal(r.totalElements  || 0);
      setSummary(s);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [userPage, reqPage]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const deactivate = async id => {
    if (!window.confirm('Deactivate this user? They will no longer be able to log in.')) return;
    try { await apiFetch(`/admin/users/${id}`, { method:'DELETE' }); showToast('User deactivated'); loadAll(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const summaryItems = [
    { key:'total',     label:'Total Requests',  color: RC.crimson,   bg: RC.pinkBg,    border: RC.crimsonLight },
    { key:'pending',   label:'Pending',          color:'#E65100',     bg: RC.cardYellow, border:'#FFD54F' },
    { key:'accepted',  label:'Accepted',         color: RC.greenDark, bg: RC.greenLight, border: RC.greenMid },
    { key:'assigned',  label:'Assigned',         color:'#512DA8',     bg:'#EDE7F6',      border:'#CE93D8' },
    { key:'inTransit', label:'In Transit',       color:'#1565C0',     bg: RC.cardBlue,   border:'#90CAF9' },
    { key:'delivered', label:'Delivered',        color: RC.greenDark, bg: RC.greenLight, border: RC.greenMid },
    { key:'rejected',  label:'Rejected',         color: RC.crimson,   bg: RC.pinkBg,    border: RC.crimsonLight },
  ];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: RC.pinkSoft }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}
      <RCSidebar role="ADMIN" entityName="Super Admin" tabs={TABS}
        activeTab={tab} onTabChange={setTab} onLogout={onLogout} />

      <div className="flex-1 flex flex-col">
        <PageHeader title={TABS.find(t=>t.key===tab)?.icon + ' ' + TABS.find(t=>t.key===tab)?.label} />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-end mb-5">
            <button onClick={loadAll}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ backgroundColor: RC.greenLight, color: RC.greenDark }}>
              ↻ Refresh All
            </button>
          </div>

          {loading ? <p style={{ color: RC.textMuted }}>Loading...</p> :

          tab === 'analytics' ? (
            <div>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {summaryItems.map(s => summary?.[s.key] != null && (
                  <div key={s.key} className="rounded-xl p-5 text-center"
                    style={{ backgroundColor: s.bg, border: `2px solid ${s.border}` }}>
                    <div className="text-3xl font-black" style={{ color: s.color }}>{summary[s.key]}</div>
                    <div className="text-xs font-semibold mt-1" style={{ color: RC.textMid }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Visual bar breakdown */}
              {summary?.total > 0 && (
                <RCCard variant="white" className="p-5">
                  <p className="text-xs font-black mb-3" style={{ color: RC.textMid }}>REQUEST STATUS BREAKDOWN</p>
                  <div className="flex h-5 rounded-full overflow-hidden gap-0.5 mb-3">
                    {[
                      { k:'delivered', color: RC.greenDark },
                      { k:'accepted',  color: RC.green },
                      { k:'assigned',  color:'#7B1FA2' },
                      { k:'inTransit', color:'#1976D2' },
                      { k:'pending',   color:'#F57C00' },
                      { k:'rejected',  color: RC.crimson },
                    ].map(({ k, color }) => summary[k] > 0 && (
                      <div key={k} title={`${k}: ${summary[k]}`}
                        className="transition-all rounded"
                        style={{ flex: summary[k]/summary.total, backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { k:'delivered', color: RC.greenDark, label:'Delivered' },
                      { k:'accepted',  color: RC.green,     label:'Accepted'  },
                      { k:'assigned',  color:'#7B1FA2',     label:'Assigned'  },
                      { k:'inTransit', color:'#1976D2',     label:'In Transit'},
                      { k:'pending',   color:'#F57C00',     label:'Pending'   },
                      { k:'rejected',  color: RC.crimson,   label:'Rejected'  },
                    ].map(({ k, color, label }) => (
                      <div key={k} className="flex items-center gap-1.5 text-xs" style={{ color: RC.textMid }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        {label} ({summary[k] || 0})
                      </div>
                    ))}
                  </div>
                </RCCard>
              )}

              {/* RC Foundation mission note */}
              <div className="mt-6 p-4 rounded-xl text-center"
                style={{ backgroundColor: RC.crimson, color: '#fff' }}>
                <p className="font-black text-sm">"Together, we can make Mumbai blood-secure."</p>
                <p className="text-xs mt-1 opacity-80">R C Foundation · Reg. No. E-13086 · Always Ready to Help You</p>
              </div>
            </div>

          ) : tab === 'users' ? (
            <div>
              <p className="text-xs mb-3 font-semibold" style={{ color: RC.textMuted }}>{userTotal} total users</p>
              <RCCard variant="white" className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}>
                      {['Name','Phone','Role','Entity','Location','Status','Action'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-black" style={{ color: RC.crimson }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const rc = ROLE_COLOR[u.role] || { bg:'#F5F5F5', color: RC.textMid };
                      return (
                        <tr key={u.id} style={{ backgroundColor: i%2===0?'#fff':RC.pinkSoft, borderBottom:'1px solid #F5E0E8' }}>
                          <td className="px-4 py-3 font-semibold" style={{ color: RC.textDark }}>{u.name || '—'}</td>
                          <td className="px-4 py-3" style={{ color: RC.textMid }}>{u.phone}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: rc.bg, color: rc.color }}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3 max-w-[100px] truncate" style={{ color: RC.textMid }}>{u.entityName || '—'}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: RC.textMuted }}>
                            {u.latitude ? `${parseFloat(u.latitude).toFixed(2)}, ${parseFloat(u.longitude).toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: u.active ? RC.greenLight : '#F5F5F5',
                                color: u.active ? RC.greenDark : RC.textMuted }}>
                              {u.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {u.role !== 'ADMIN' && u.active && (
                              <button onClick={() => deactivate(u.id)}
                                className="text-xs font-bold transition-all hover:underline"
                                style={{ color: RC.crimson }}>Deactivate</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="py-2" style={{ borderTop: `1px solid ${RC.crimsonLight}` }}>
                  <Pagination page={userPage} total={userTotal} size={PAGE} onChange={setUPage} />
                </div>
              </RCCard>
            </div>

          ) : (
            <div>
              <p className="text-xs mb-3 font-semibold" style={{ color: RC.textMuted }}>{reqTotal} total requests</p>
              <RCCard variant="white" className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: RC.pinkBg, borderBottom: `2px solid ${RC.crimsonLight}` }}>
                      {['Patient','Blood','Qty','Hospital','Urgency','Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-black" style={{ color: RC.crimson }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r, i) => (
                      <tr key={r.id} style={{ backgroundColor: i%2===0?'#fff':RC.pinkSoft, borderBottom:'1px solid #F5E0E8' }}>
                        <td className="px-4 py-3 font-semibold" style={{ color: RC.textDark }}>{r.patientName||'—'}</td>
                        <td className="px-4 py-3 font-black" style={{ color: RC.crimson }}>{r.bloodGroup}</td>
                        <td className="px-4 py-3" style={{ color: RC.textMid }}>{r.quantity}</td>
                        <td className="px-4 py-3 max-w-[100px] truncate" style={{ color: RC.textMid }}>{r.hospitalName||'—'}</td>
                        <td className="px-4 py-3">
                          {r.urgency==='URGENT'
                            ? <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: RC.pinkBg, color: RC.crimson }}>🚨 Urgent</span>
                            : <span className="text-xs" style={{ color: RC.textMuted }}>Normal</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="py-2" style={{ borderTop: `1px solid ${RC.crimsonLight}` }}>
                  <Pagination page={reqPage} total={reqTotal} size={PAGE} onChange={setRPage} />
                </div>
              </RCCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
