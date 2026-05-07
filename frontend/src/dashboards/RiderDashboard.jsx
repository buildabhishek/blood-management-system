import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/api';
import RCToast from '../components/RCToast';
import RCCard  from '../components/RCCard';
import { RC }  from '../components/RCTheme';
import NotificationBell from '../components/NotificationBell';
import RCLogo from '../components/RCLogo';

const STATUS_FLOW = { ASSIGNED: 'IN_TRANSIT', IN_TRANSIT: 'DELIVERED' };
const STATUS_LABELS = {
  ASSIGNED:   { label:'Assigned — Head to Blood Bank', icon:'📋', color:'#512DA8', bg:'#EDE7F6' },
  IN_TRANSIT: { label:'In Transit — Heading to Hospital', icon:'🚚', color:'#1565C0', bg:RC.cardBlue },
  DELIVERED:  { label:'Delivered ✅', icon:'✅', color:RC.greenDark, bg:RC.greenLight },
  CANCELLED:  { label:'Cancelled', icon:'🚫', color:'#888', bg:'#F5F5F5' },
};
const NEXT_BTN = {
  ASSIGNED:   { label:'🏍 Mark as Picked Up', color: RC.greenDark },
  IN_TRANSIT: { label:'✅ Confirm Delivery (OTP)', color: RC.crimson },
};

function UBadge({ urgency }) {
  if (urgency==='CRITICAL') return <span className="pulse-urgent" style={{ fontSize:'11px',fontWeight:900,padding:'3px 8px',borderRadius:'20px',backgroundColor:RC.crimson,color:'#fff' }}>🚨 CRITICAL</span>;
  if (urgency==='URGENT')   return <span style={{ fontSize:'11px',fontWeight:900,padding:'3px 8px',borderRadius:'20px',backgroundColor:RC.pinkBg,color:RC.crimson }}>⚡ URGENT</span>;
  return null;
}

function OtpModal({ onConfirm, onCancel, loading }) {
  const [otp, setOtp] = useState('');
  return (
    <div style={{ position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.55)',zIndex:1000,
      display:'flex',alignItems:'center',justifyContent:'center',padding:'24px' }}>
      <div style={{ backgroundColor:'#fff',borderRadius:'18px',padding:'28px',width:'100%',
        maxWidth:'360px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',textAlign:'center' }}>
        <div style={{ fontSize:'48px',marginBottom:'12px' }}>🔐</div>
        <h3 style={{ margin:'0 0 8px',fontWeight:900,color:RC.crimson }}>Enter Delivery OTP</h3>
        <p style={{ fontSize:'13px',color:RC.textMid,margin:'0 0 18px' }}>
          Ask the hospital staff for the 4-digit OTP to confirm delivery.
        </p>
        <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,4))}
          maxLength={4} inputMode="numeric" placeholder="_ _ _ _"
          style={{ width:'100%',padding:'14px',textAlign:'center',fontSize:'28px',letterSpacing:'8px',
            fontFamily:'monospace',fontWeight:900,borderRadius:'12px',border:`2px solid ${otp.length===4?RC.greenDark:RC.crimsonLight}`,
            outline:'none',color:RC.textDark,boxSizing:'border-box',marginBottom:'16px' }} />
        <div style={{ display:'flex',gap:'10px' }}>
          <button onClick={onCancel} style={{ flex:1,padding:'11px',borderRadius:'10px',fontWeight:700,
            fontSize:'13px',backgroundColor:'#F5F5F5',color:RC.textMid,border:'none',cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>onConfirm(otp)} disabled={otp.length!==4||loading}
            style={{ flex:1,padding:'11px',borderRadius:'10px',fontWeight:900,fontSize:'13px',
              backgroundColor:otp.length===4?RC.crimson:'#C0C0C0',color:'#fff',border:'none',
              cursor:otp.length!==4?'not-allowed':'pointer',opacity:loading?0.7:1 }}>
            {loading?'Verifying…':'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onStatusUpdate, onToast }) {
  const [acting,  setActing]  = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const next = STATUS_FLOW[task.status];
  const sl   = STATUS_LABELS[task.status] || {};

  const advance = async (otp) => {
    if (!next) return;
    setActing(true); setShowOtp(false);
    try {
      await apiFetch(`/requests/${task.id}/rider-status`, {
        method: 'PUT', body: JSON.stringify({ status: next, otp: otp || null }),
      });
      const msgs = { IN_TRANSIT:'📦 Picked up! En route to hospital.', DELIVERED:'✅ Delivery confirmed!' };
      onToast(msgs[next] || 'Status updated.');
      onStatusUpdate();
    } catch(e) { onToast('❌ ' + e.message, 'error'); }
    finally { setActing(false); }
  };

  const handleAdvance = () => {
    if (next === 'DELIVERED') { setShowOtp(true); return; }
    if (window.confirm(`Mark as ${next.replace('_',' ')}?`)) advance();
  };

  return (
    <>
      {showOtp && <OtpModal onConfirm={advance} onCancel={()=>setShowOtp(false)} loading={acting} />}
      <RCCard variant={task.urgency !== 'NORMAL' ? 'pink' : 'white'}
        style={task.urgency !== 'NORMAL' ? { border:`2px solid ${RC.crimson}` } : {}}>
        <div style={{ padding:'18px' }}>

          {/* Status banner */}
          <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',
            padding:'8px 12px',borderRadius:'9px',backgroundColor:sl.bg||'#F5F5F5' }}>
            <span style={{ fontSize:'18px' }}>{sl.icon}</span>
            <span style={{ fontWeight:700,fontSize:'13px',color:sl.color||RC.textMid }}>{sl.label}</span>
            {task.urgency !== 'NORMAL' && <span style={{ marginLeft:'auto' }}><UBadge urgency={task.urgency} /></span>}
          </div>

          {/* Blood info */}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px' }}>
            <p style={{ margin:0,fontWeight:900,fontSize:'22px',color:RC.crimson }}>
              {task.bloodGroup} · {task.quantity} unit{task.quantity>1?'s':''}
              {task.componentType && <span style={{ fontSize:'14px',fontWeight:400,color:RC.textMid }}> ({task.componentType})</span>}
            </p>
          </div>

          {/* Route */}
          <div style={{ display:'flex',alignItems:'stretch',gap:'0',marginBottom:'12px' }}>
            <div style={{ flex:1,padding:'10px 14px',backgroundColor:RC.pinkBg,borderRadius:'10px 0 0 10px',
              border:`1.5px solid ${RC.crimsonLight}`,borderRight:'none' }}>
              <p style={{ margin:0,fontSize:'10px',fontWeight:700,color:RC.crimson,textTransform:'uppercase' }}>Pickup</p>
              <p style={{ margin:'3px 0 0',fontWeight:700,fontSize:'13px',color:RC.textDark }}>{task.bloodBankName||'Blood Bank'}</p>
            </div>
            <div style={{ display:'flex',alignItems:'center',backgroundColor:'#F5F5F5',padding:'0 8px',
              border:`1.5px solid #E0E0E0`,borderLeft:'none',borderRight:'none' }}>
              <span style={{ fontSize:'18px' }}>→</span>
            </div>
            <div style={{ flex:1,padding:'10px 14px',backgroundColor:RC.greenLight,borderRadius:'0 10px 10px 0',
              border:`1.5px solid ${RC.greenMid}`,borderLeft:'none' }}>
              <p style={{ margin:0,fontSize:'10px',fontWeight:700,color:RC.greenDark,textTransform:'uppercase' }}>Deliver to</p>
              <p style={{ margin:'3px 0 0',fontWeight:700,fontSize:'13px',color:RC.textDark }}>{task.hospitalName||'Hospital'}</p>
            </div>
          </div>

          {/* Patient */}
          <div style={{ marginBottom:'10px',padding:'8px 12px',backgroundColor:'#FAFAFA',borderRadius:'9px',
            border:'1px solid #E0E0E0' }}>
            <p style={{ margin:0,fontSize:'12px',color:RC.textMid }}>
              👤 Patient: <strong>{task.patientName}</strong>
              {task.patientAge && <span> · Age {task.patientAge}</span>}
              {task.wardBed    && <span> · {task.wardBed}</span>}
            </p>
            {task.notes && <p style={{ margin:'4px 0 0',fontSize:'11px',color:RC.textMuted,fontStyle:'italic' }}>📝 {task.notes}</p>}
          </div>

          {/* Request ID */}
          <p style={{ margin:'0 0 12px',fontSize:'11px',color:RC.textMuted }}>Request #<strong>{task.id}</strong></p>

          {/* Action Button */}
          {next && NEXT_BTN[task.status] && (
            <button onClick={handleAdvance} disabled={acting}
              style={{ width:'100%',padding:'12px',borderRadius:'12px',fontWeight:900,fontSize:'14px',
                border:'none',cursor:acting?'not-allowed':'pointer',
                backgroundColor:NEXT_BTN[task.status].color,color:'#fff',opacity:acting?0.7:1,
                transition:'opacity 0.2s' }}>
              {acting ? '⏳ Updating…' : NEXT_BTN[task.status].label}
            </button>
          )}
        </div>
      </RCCard>
    </>
  );
}

export default function RiderDashboard({ onLogout }) {
  const [tab,       setTab]       = useState('tasks');
  const [tasks,     setTasks]     = useState([]);
  const [history,   setHistory]   = useState([]);
  const [available, setAvailable] = useState(localStorage.getItem('available') !== 'false');
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState(null);
  const [toggling,  setToggling]  = useState(false);

  const name  = localStorage.getItem('name') || localStorage.getItem('entityName') || 'Rider';
  const zone  = localStorage.getItem('assignedZone') || '';
  const phone = localStorage.getItem('phone') || '';

  const showToast = useCallback((msg, type='success') => setToast({ msg, type }), []);

  const loadTasks = useCallback(async () => {
    try {
      const data = await apiFetch('/requests/rider/tasks');
      setTasks(data || []);
    } catch { setTasks([]); } finally { setLoading(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    try { setHistory(await apiFetch('/requests/rider/history') || []); }
    catch { setHistory([]); }
  }, []);

  useEffect(() => {
    loadTasks();
    const iv = setInterval(loadTasks, 8000);
    return () => clearInterval(iv);
  }, [loadTasks]);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const toggleAvailability = async () => {
    setToggling(true);
    const next = !available;
    try {
      await apiFetch('/users/availability', { method:'PUT', body: JSON.stringify({ available: next }) });
      setAvailable(next);
      localStorage.setItem('available', String(next));
      showToast(next ? '✅ You are now available for assignments.' : '⏸ You are now off-duty.');
    } catch(e) { showToast('❌ ' + e.message, 'error'); }
    finally { setToggling(false); }
  };

  const urgent = tasks.filter(t => t.urgency !== 'NORMAL').length;

  return (
    <div style={{ minHeight:'100vh', backgroundColor: '#F8F4F6' }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={{ backgroundColor: RC.crimson, padding:'14px 20px',
        display:'flex', alignItems:'center', gap:'12px',
        borderBottom:`3px solid ${RC.greenDark}`, position:'sticky', top:0, zIndex:200, overflow:'visible' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', backgroundColor: RC.green }} />
        <RCLogo size={38} />
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontWeight:900, fontSize:'15px', color:'#fff' }}>🏍 {name}</p>
          <p style={{ margin:0, fontSize:'11px', color: RC.greenMid }}>
            Rider{zone ? ` · Zone: ${zone}` : ''}{phone ? ` · ${phone}` : ''}
          </p>
        </div>

        {/* Availability toggle */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'12px', fontWeight:700,
            color: available ? RC.greenMid : 'rgba(255,255,255,0.5)' }}>
            {available ? '🟢 Available' : '🔴 Off-Duty'}
          </span>
          <button onClick={toggleAvailability} disabled={toggling}
            style={{ padding:'7px 14px', borderRadius:'20px', fontWeight:700, fontSize:'12px',
              border:'2px solid', cursor: toggling ? 'not-allowed' : 'pointer', transition:'all 0.2s',
              backgroundColor: available ? RC.greenDark : 'rgba(255,255,255,0.15)',
              borderColor: available ? RC.green : 'rgba(255,255,255,0.3)',
              color:'#fff', opacity: toggling ? 0.6 : 1 }}>
            {toggling ? '…' : available ? 'Go Off-Duty' : 'Go Available'}
          </button>
        </div>

        <NotificationBell />

        <button onClick={onLogout} title="Logout"
          style={{ background:'none', border:'1.5px solid rgba(255,255,255,0.3)',
            borderRadius:'8px', padding:'6px 12px', color:'rgba(255,255,255,0.7)',
            fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div style={{ backgroundColor:'#fff', borderBottom:`2px solid ${RC.crimsonLight}`,
        display:'flex', padding:'0 20px' }}>
        {[
          { key:'tasks',   label:'Active Tasks',    icon:'📋' },
          { key:'history', label:'Delivery History', icon:'📊' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'13px 20px', fontWeight:700, fontSize:'13px', border:'none',
              cursor:'pointer', transition:'all 0.15s', background:'none',
              borderBottom: tab === t.key ? `3px solid ${RC.crimson}` : '3px solid transparent',
              color: tab === t.key ? RC.crimson : RC.textMuted }}>
            {t.icon} {t.label}
            {t.key === 'tasks' && tasks.length > 0 && (
              <span style={{ marginLeft:'6px', backgroundColor: RC.crimson, color:'#fff',
                borderRadius:'10px', padding:'1px 7px', fontSize:'11px', fontWeight:900 }}>
                {tasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <main style={{ padding:'20px', maxWidth:'680px', margin:'0 auto' }}>

        {/* Tasks Tab */}
        {tab === 'tasks' && (
          <>
            {!available && (
              <RCCard variant="yellow" style={{ padding:'14px 18px', marginBottom:'16px',
                border:'2px solid #FFD54F' }}>
                <p style={{ margin:0, fontWeight:700, fontSize:'13px', color:'#E65100' }}>
                  ⏸ You are currently <strong>Off-Duty</strong>. You will not receive new assignments.
                  Toggle to <strong>Available</strong> to accept tasks.
                </p>
              </RCCard>
            )}

            {urgent > 0 && (
              <div className="pulse-urgent" style={{ marginBottom:'14px', padding:'12px 18px',
                borderRadius:'12px', backgroundColor:RC.pinkBg, border:`2px solid ${RC.crimson}` }}>
                <p style={{ margin:0, fontWeight:900, fontSize:'13px', color:RC.crimson }}>
                  🚨 {urgent} urgent/critical task{urgent > 1 ? 's' : ''} — prioritise immediately!
                </p>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign:'center', padding:'60px', color: RC.textMuted }}>⏳ Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <RCCard variant="green" style={{ padding:'60px', textAlign:'center' }}>
                <p style={{ fontSize:'48px', margin:'0 0 12px' }}>✅</p>
                <p style={{ fontWeight:700, fontSize:'16px', color: RC.greenDark, margin:'0 0 6px' }}>No active tasks</p>
                <p style={{ fontSize:'13px', color: RC.textMuted, margin:0 }}>
                  {available ? 'Waiting for the blood bank to assign a delivery.' : 'You are off-duty. Go available to receive tasks.'}
                </p>
              </RCCard>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {[...tasks].sort((a,b) => {
                  const w = { CRITICAL:3, URGENT:2, NORMAL:1 };
                  return (w[b.urgency]||0) - (w[a.urgency]||0);
                }).map(t => (
                  <TaskCard key={t.id} task={t} onStatusUpdate={loadTasks} onToast={showToast} />
                ))}
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'18px' }}>
              {[
                { label:'Total Deliveries', value: history.length,                                    bg:RC.cardBlue,  c:'#1565C0',  bd:'#90CAF9'    },
                { label:'Delivered',        value: history.filter(r=>r.status==='DELIVERED').length,  bg:RC.greenLight,c:RC.greenDark,bd:RC.greenMid  },
                { label:'Cancelled',        value: history.filter(r=>r.status==='CANCELLED').length,  bg:RC.cardYellow,c:'#E65100',  bd:'#FFD54F'    },
              ].map(k => (
                <div key={k.label} style={{ borderRadius:'12px', padding:'14px', textAlign:'center',
                  backgroundColor:k.bg, border:`1.5px solid ${k.bd}` }}>
                  <div style={{ fontSize:'26px', fontWeight:900, color:k.c }}>{k.value}</div>
                  <div style={{ fontSize:'11px', fontWeight:600, color:RC.textMid, marginTop:'3px' }}>{k.label}</div>
                </div>
              ))}
            </div>

            {history.length === 0 ? (
              <RCCard variant="green" style={{ padding:'40px', textAlign:'center' }}>
                <p style={{ fontWeight:700, color: RC.greenDark, margin:0 }}>No delivery history yet.</p>
              </RCCard>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {history.map((r, i) => (
                  <RCCard key={r.id} variant={i%2===0?'white':'pink'}>
                    <div style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between',
                      alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                      <div>
                        <p style={{ margin:0, fontWeight:900, fontSize:'16px', color:RC.crimson }}>
                          {r.bloodGroup} · {r.quantity} unit{r.quantity>1?'s':''}
                        </p>
                        <p style={{ margin:'3px 0 0', fontSize:'12px', color:RC.textMid }}>
                          {r.bloodBankName||'—'} → {r.hospitalName||'—'}
                        </p>
                        <p style={{ margin:'2px 0 0', fontSize:'11px', color:RC.textMuted }}>
                          #{r.id} · {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <span style={{ fontSize:'11px', fontWeight:700, padding:'4px 12px', borderRadius:'20px',
                        backgroundColor: r.status==='DELIVERED' ? RC.greenLight : RC.pinkBg,
                        color: r.status==='DELIVERED' ? RC.greenDark : RC.crimson }}>
                        {r.status}
                      </span>
                    </div>
                  </RCCard>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
