import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/api';
import RCLogo from '../components/RCLogo';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC } from '../components/RCTheme';
import NotificationBell from '../components/NotificationBell';

const STATUS_FLOW = ['ASSIGNED','IN_TRANSIT','DELIVERED'];

const TABS = [
  { key:'tasks',   label:'Active Deliveries', icon:'🚚' },
  { key:'history', label:'Completed',          icon:'✅' },
];

function StatusBadge({ status }) {
  const map = {
    ASSIGNED:  { bg:'#EDE7F6', color:'#512DA8' },
    IN_TRANSIT:{ bg: RC.cardBlue, color:'#1565C0' },
    DELIVERED: { bg: RC.greenLight, color: RC.greenDark },
    CANCELLED: { bg:'#F5F5F5', color:'#888' },
  };
  const s = map[status] || { bg:'#F5F5F5', color: RC.textMid };
  return (
    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'20px',
      backgroundColor: s.bg, color: s.color }}>
      {status.replace('_',' ')}
    </span>
  );
}

/* ── OTP Delivery Confirmation Modal ─────────────────────────── */
function DeliveryOtpModal({ task, onConfirm, onClose }) {
  const [otp, setOtp]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoad]  = useState(false);

  const handleConfirm = async () => {
    if (!otp.trim() || otp.trim().length !== 4 || !/^\d{4}$/.test(otp.trim())) {
      setError('Please enter the 4-digit OTP provided by the hospital.'); return;
    }
    setError('');
    setLoad(true);
    const err = await onConfirm(otp.trim());
    if (err) { setError(err); setLoad(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, display:'flex',
      alignItems:'center', justifyContent:'center', backgroundColor:'rgba(0,0,0,0.65)' }}
      onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:'18px', padding:'28px', maxWidth:'380px',
        width:'92vw', boxShadow:'0 12px 40px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <div style={{ fontSize:'48px', marginBottom:'8px' }}>🔐</div>
          <h3 style={{ margin:'0 0 6px', fontWeight:900, color: RC.greenDark, fontSize:'18px' }}>
            Confirm Delivery
          </h3>
          <p style={{ margin:0, fontSize:'13px', color: RC.textMid }}>
            Ask the hospital staff for the 4-digit OTP to confirm delivery of{' '}
            <strong style={{ color: RC.crimson }}>{task.bloodGroup}</strong> for patient{' '}
            <strong>{task.patientName}</strong>.
          </p>
        </div>

        <div style={{ textAlign:'center', marginBottom:'20px' }}>
          <input
            value={otp} maxLength={4} autoFocus
            onChange={e => { setOtp(e.target.value.replace(/\D/,'')); setError(''); }}
            placeholder="0000"
            style={{
              fontSize:'32px', fontWeight:900, letterSpacing:'12px', textAlign:'center',
              width:'180px', padding:'14px 16px', borderRadius:'14px', outline:'none',
              border:`2px solid ${error ? RC.crimson : RC.greenMid}`, color: RC.textDark,
            }}
          />
        </div>

        {error && (
          <p style={{ margin:'0 0 14px', fontSize:'13px', color: RC.crimson,
            fontWeight:700, textAlign:'center' }}>⚠ {error}</p>
        )}

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'12px', borderRadius:'12px', fontSize:'14px', fontWeight:700,
              backgroundColor:'#E0E0E0', color: RC.textMid, border:'none', cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading || otp.length !== 4}
            style={{ flex:2, padding:'12px', borderRadius:'12px', fontSize:'14px', fontWeight:900,
              backgroundColor: otp.length === 4 ? RC.greenDark : '#C0C0C0',
              color:'#fff', border:'none', cursor: otp.length===4 ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Verifying OTP...' : '✅ Confirm Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Active Tasks ─────────────────────────────────────────────── */
function ActiveTasks({ onToast }) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpTask, setOtpTask] = useState(null);
  const [advancing, setAdv]   = useState(null);

  const load = useCallback(async () => {
    try { setTasks(await apiFetch('/requests/rider/tasks') || []); }
    catch { setTasks([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 6000);
    const vis = () => document.hidden ? clearInterval(iv) : null;
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', vis); };
  }, [load]);

  const advance = async (task, otp) => {
    const nextMap = { ASSIGNED:'IN_TRANSIT', IN_TRANSIT:'DELIVERED' };
    const next = nextMap[task.status];
    if (!next) return;

    if (next === 'IN_TRANSIT') {
      if (!window.confirm(`Confirm pickup of ${task.bloodGroup} from blood bank?\nMake sure you have collected the blood unit and all required documents.`))
        return;
    }

    setAdv(task.id);
    try {
      await apiFetch(`/requests/${task.id}/rider-status`, { method:'PUT',
        body: JSON.stringify({ status: next, otp: otp || null }) });
      onToast(next === 'DELIVERED'
        ? '✅ Delivery confirmed! Great work.'
        : '🚚 Status updated to In Transit.');
      setOtpTask(null);
      load();
      return null; // no error
    } catch (e) {
      onToast('❌ ' + e.message, 'error');
      return e.message; // return error for OTP modal
    } finally { setAdv(null); }
  };

  const handleAdvanceClick = (task) => {
    if (task.status === 'IN_TRANSIT') {
      // Need OTP to confirm delivery
      setOtpTask(task);
    } else {
      advance(task, null);
    }
  };

  const getNext = s => ({ ASSIGNED:'IN_TRANSIT', IN_TRANSIT:'DELIVERED' }[s]);
  const curIdx  = s => STATUS_FLOW.indexOf(s);

  return (
    <div>
      {otpTask && (
        <DeliveryOtpModal
          task={otpTask}
          onConfirm={(otp) => advance(otpTask, otp)}
          onClose={() => setOtpTask(null)} />
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
        <p style={{ margin:0, fontSize:'12px', color: RC.textMuted }}>⟳ Auto-refreshes every 6 seconds</p>
        <button onClick={load} style={{ padding:'5px 14px', borderRadius:'8px', fontSize:'12px',
          fontWeight:700, backgroundColor: RC.greenLight, color: RC.greenDark,
          border:`1px solid ${RC.greenMid}`, cursor:'pointer' }}>↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color: RC.textMuted }}>⏳ Loading deliveries...</div>
      ) : tasks.length === 0 ? (
        <RCCard variant="green" style={{ padding:'60px', textAlign:'center' }}>
          <div style={{ fontSize:'56px', marginBottom:'12px' }}>🏍</div>
          <p style={{ fontWeight:700, fontSize:'16px', color: RC.greenDark, margin:'0 0 6px' }}>
            No active deliveries
          </p>
          <p style={{ fontSize:'13px', color: RC.textMuted, margin:0 }}>
            Check back soon — the blood bank will assign tasks here.
          </p>
        </RCCard>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {[...tasks].sort((a,b) => (b.urgency==='URGENT')-(a.urgency==='URGENT')).map(task => {
            const next = getNext(task.status);
            const ci   = curIdx(task.status);
            return (
              <RCCard key={task.id} variant="white"
                style={task.urgency==='URGENT' ? { border:`2px solid ${RC.crimson}` } : {}}>
                <div style={{ padding:'18px' }}>
                  {/* Header row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                        <span style={{ fontSize:'20px', fontWeight:900, color: RC.crimson }}>{task.bloodGroup}</span>
                        <span style={{ fontSize:'14px', color: RC.textMid, fontWeight:600 }}>
                          {task.quantity} unit{task.quantity>1?'s':''}
                        </span>
                        {task.urgency === 'URGENT' && (
                          <span style={{ fontSize:'11px', fontWeight:900, padding:'3px 8px', borderRadius:'20px',
                            backgroundColor: RC.pinkBg, color: RC.crimson }}>🚨 URGENT</span>
                        )}
                      </div>
                      <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'14px', color: RC.textDark }}>
                        🏥 {task.hospitalName || 'Hospital'}
                      </p>
                      <p style={{ margin:0, fontSize:'12px', color: RC.textMuted }}>
                        Patient: {task.patientName}
                      </p>
                      {task.notes && (
                        <p style={{ margin:'4px 0 0', fontSize:'12px', color: RC.textMuted, fontStyle:'italic' }}>
                          📝 {task.notes}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'3px', marginBottom:'6px' }}>
                      {STATUS_FLOW.map((step, i) => (
                        <div key={step} style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                          <div style={{ width:'16px', height:'16px', borderRadius:'50%',
                            backgroundColor: i<=ci ? RC.crimson : '#E0E0E0',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            transition:'background 0.3s', flexShrink:0 }}>
                            {i < ci && <span style={{ color:'#fff', fontSize:'9px', fontWeight:900 }}>✓</span>}
                          </div>
                          {i < STATUS_FLOW.length-1 && (
                            <div style={{ width:'40px', height:'3px', borderRadius:'2px',
                              backgroundColor: i<ci ? RC.crimson : '#E0E0E0', transition:'background 0.3s' }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', fontSize:'10px', color: RC.textMuted, gap:'2px' }}>
                      <span style={{ flex:1 }}>Assigned</span>
                      <span style={{ flex:1, textAlign:'center' }}>In Transit</span>
                      <span style={{ textAlign:'right' }}>Delivered</span>
                    </div>
                  </div>

                  {/* Action button */}
                  {next && (
                    <button onClick={() => handleAdvanceClick(task)} disabled={advancing === task.id}
                      style={{ width:'100%', padding:'13px', borderRadius:'12px', fontSize:'14px',
                        fontWeight:900, border:'none', cursor: advancing===task.id ? 'not-allowed':'pointer',
                        backgroundColor: next==='DELIVERED' ? RC.greenDark : RC.crimson,
                        color:'#fff', transition:'all 0.2s', opacity: advancing===task.id ? 0.7 : 1 }}
                      onMouseEnter={e => { if (advancing!==task.id) e.currentTarget.style.opacity='0.85'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}>
                      {advancing === task.id ? '⏳ Updating...'
                        : next==='IN_TRANSIT' ? '🚚 Mark as Picked Up & In Transit'
                        : '🔐 Enter OTP & Confirm Delivery'}
                    </button>
                  )}

                  {task.status === 'DELIVERED' && (
                    <div style={{ textAlign:'center', padding:'10px', borderRadius:'10px',
                      backgroundColor: RC.greenLight, border:`1px solid ${RC.greenMid}` }}>
                      <p style={{ margin:0, fontWeight:900, color: RC.greenDark, fontSize:'14px' }}>
                        ✅ Delivery completed successfully
                      </p>
                    </div>
                  )}
                </div>
              </RCCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Delivery History ─────────────────────────────────────────── */
function DeliveryHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/requests/rider/history')
      .then(d => setHistory(d || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const deliveredCount = history.filter(h => h.status === 'DELIVERED').length;

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
        {[
          { label:'Total Assigned', value: history.length, bg: RC.cardBlue, color:'#1565C0', border:'#90CAF9' },
          { label:'Delivered', value: deliveredCount, bg: RC.greenLight, color: RC.greenDark, border: RC.greenMid },
        ].map(s => (
          <div key={s.label} style={{ borderRadius:'12px', padding:'16px', textAlign:'center',
            backgroundColor: s.bg, border:`1.5px solid ${s.border}` }}>
            <div style={{ fontSize:'28px', fontWeight:900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize:'12px', fontWeight:600, color: RC.textMid, marginTop:'3px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color: RC.textMuted }}>Loading history...</div>
      ) : history.length === 0 ? (
        <RCCard variant="green" style={{ padding:'40px', textAlign:'center' }}>
          <p style={{ color: RC.greenDark, fontWeight:600, margin:0 }}>No delivery history yet.</p>
        </RCCard>
      ) : (
        <RCCard variant="white" style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
            <thead>
              <tr style={{ backgroundColor: RC.pinkBg, borderBottom:`2px solid ${RC.crimsonLight}` }}>
                {['#','Blood','Qty','Hospital','Patient','Status'].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'10px 14px',
                    fontSize:'11px', fontWeight:900, color: RC.crimson }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i%2===0?'#fff':RC.pinkSoft, borderBottom:'1px solid #F5E0E8' }}>
                  <td style={{ padding:'10px 14px', color: RC.textMuted, fontSize:'11px' }}>#{r.id}</td>
                  <td style={{ padding:'10px 14px', fontWeight:900, color: RC.crimson }}>{r.bloodGroup}</td>
                  <td style={{ padding:'10px 14px', color: RC.textMid }}>{r.quantity}</td>
                  <td style={{ padding:'10px 14px', color: RC.textMid, maxWidth:'120px',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.hospitalName || '—'}
                  </td>
                  <td style={{ padding:'10px 14px', fontWeight:600, color: RC.textDark }}>{r.patientName}</td>
                  <td style={{ padding:'10px 14px' }}><StatusBadge status={r.status} /></td>
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
export default function RiderDashboard({ onLogout }) {
  const [tab, setTab]     = useState('tasks');
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);
  const name = localStorage.getItem('name') || localStorage.getItem('entityName') || 'Rider';

  return (
    <div style={{ minHeight:'100vh', backgroundColor: RC.pinkSoft }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={{ backgroundColor: RC.crimson, borderBottom:`3px solid ${RC.greenDark}` }}>
        <div style={{ height:'4px', backgroundColor: RC.green }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <RCLogo size={42} />
            <div>
              <p style={{ color:'#fff', fontWeight:900, fontSize:'14px', margin:0 }}>R C FOUNDATION</p>
              <p style={{ color: RC.greenMid, fontSize:'11px', fontWeight:500, margin:0 }}>
                Rider Portal — {name}
              </p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <NotificationBell />
            <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.55)' }}>Auto-refresh: 6s</span>
            <button onClick={onLogout}
              style={{ padding:'8px 16px', borderRadius:'9px', fontSize:'13px', fontWeight:700,
                backgroundColor: RC.greenDark, color:'#fff', border:'none', cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.green}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = RC.greenDark}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div style={{ backgroundColor:'#fff', borderBottom:`2px solid ${RC.crimsonLight}`,
        display:'flex', padding:'0 20px', gap:'4px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'13px 18px', fontSize:'13px', fontWeight:700, border:'none',
              cursor:'pointer', background:'transparent', transition:'all 0.15s',
              color: tab===t.key ? RC.crimson : RC.textMid,
              borderBottom: tab===t.key ? `3px solid ${RC.crimson}` : '3px solid transparent' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <main style={{ padding:'20px', maxWidth:'680px', margin:'0 auto' }}>
        {tab === 'tasks'   && <ActiveTasks onToast={showToast} />}
        {tab === 'history' && <DeliveryHistory />}
      </main>

      <div style={{ textAlign:'center', padding:'16px', fontSize:'11px', color: RC.textMuted }}>
        R C Foundation · Always Ready to Help You · Reg. No. E-13086
      </div>
    </div>
  );
}
