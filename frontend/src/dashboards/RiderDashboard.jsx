import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../api/api';
import RCLogo from '../components/RCLogo';
import RCToast from '../components/RCToast';
import RCCard from '../components/RCCard';
import { RC } from '../components/RCTheme';

const STATUS_FLOW = ['ASSIGNED','IN_TRANSIT','DELIVERED'];

function StatusBadge({ status }) {
  const map = {
    ASSIGNED:   { bg:'#EDE7F6', color:'#512DA8' },
    IN_TRANSIT: { bg: RC.cardBlue, color:'#1565C0' },
    DELIVERED:  { bg: RC.greenLight, color: RC.greenDark },
  };
  const s = map[status] || { bg:'#F5F5F5', color: RC.textMid };
  return (
    <span className="text-xs font-bold px-2 py-1 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>{status.replace('_',' ')}</span>
  );
}

export default function RiderDashboard({ onLogout }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const showToast = (msg, type='success') => setToast({ msg, type });

  const load = useCallback(async () => {
    try { setTasks(await apiFetch('/requests/rider/tasks')); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    let interval;
    const start = () => { interval = setInterval(load, 5000); };
    const stop  = () => clearInterval(interval);
    const vis   = () => document.hidden ? stop() : start();
    document.addEventListener('visibilitychange', vis);
    start();
    return () => { stop(); document.removeEventListener('visibilitychange', vis); };
  }, [load]);

  const advance = async (id, next) => {
    try {
      await apiFetch(`/requests/${id}/rider-status`, { method:'PUT', body: JSON.stringify({ status: next }) });
      showToast(`Marked as ${next.replace('_',' ')}`);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const getNext = s => {
    const i = STATUS_FLOW.indexOf(s);
    return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i+1] : null;
  };

  const active    = tasks.filter(t => t.status !== 'DELIVERED').length;
  const delivered = tasks.filter(t => t.status === 'DELIVERED').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: RC.pinkSoft }}>
      {toast && <RCToast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={{ backgroundColor: RC.crimson, borderBottom: `3px solid ${RC.greenDark}` }}>
        {/* Green top stripe */}
        <div className="h-1.5 w-full" style={{ backgroundColor: RC.green }} />
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <RCLogo size={44} />
            <div>
              <p className="text-white font-black text-sm">R C FOUNDATION</p>
              <p className="text-xs font-medium" style={{ color: RC.greenMid }}>Rider Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs opacity-60 text-white">Auto-refreshes every 5s</span>
            <button onClick={onLogout}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ backgroundColor: RC.greenDark, color: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.green}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = RC.greenDark}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label:'Active Deliveries', value: active,    bg: RC.pinkBg,    color: RC.crimson,   border: RC.crimsonLight },
            { label:'Completed Today',   value: delivered, bg: RC.greenLight, color: RC.greenDark, border: RC.greenMid    },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-5 text-center"
              style={{ backgroundColor: s.bg, border: `2px solid ${s.border}` }}>
              <div className="text-4xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: RC.textMid }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? <p style={{ color: RC.textMuted }}>Loading deliveries...</p> :
          tasks.length === 0 ? (
            <RCCard variant="green" className="p-12 text-center">
              <div className="text-5xl mb-4">🏍</div>
              <p className="font-bold" style={{ color: RC.greenDark }}>No deliveries assigned yet</p>
              <p className="text-sm mt-1" style={{ color: RC.textMuted }}>Check back soon — the blood bank will assign tasks here</p>
            </RCCard>
          ) : (
          <div className="space-y-4">
            {[...tasks].sort((a,b) => (a.status==='DELIVERED')-(b.status==='DELIVERED')).map(task => {
              const next = getNext(task.status);
              const curIdx = STATUS_FLOW.indexOf(task.status);
              return (
                <RCCard key={task.id} variant={task.status==='DELIVERED' ? 'green' : 'white'}
                  style={task.urgency==='URGENT' ? { borderColor: RC.crimson, borderWidth:'2px' } : {}}>
                  <div className="p-5">
                    {/* Task header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-black" style={{ color: RC.crimson }}>{task.bloodGroup}</span>
                          <span className="font-semibold text-sm" style={{ color: RC.textMid }}>
                            {task.quantity} unit{task.quantity>1?'s':''}
                          </span>
                          {task.urgency === 'URGENT' && (
                            <span className="text-xs font-black px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: RC.pinkBg, color: RC.crimson }}>🚨 URGENT</span>
                          )}
                        </div>
                        <p className="font-bold" style={{ color: RC.textDark }}>🏥 {task.hospitalName}</p>
                        <p className="text-xs mt-0.5" style={{ color: RC.textMuted }}>Patient: {task.patientName}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-1 mb-2">
                      {STATUS_FLOW.map((step, i) => (
                        <div key={step} className="flex items-center gap-1">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all"
                            style={{ backgroundColor: i <= curIdx ? RC.crimson : '#E0E0E0' }}>
                            {i < curIdx && <span className="text-white text-xs">✓</span>}
                          </div>
                          {i < STATUS_FLOW.length-1 && (
                            <div className="w-12 h-1 rounded transition-all"
                              style={{ backgroundColor: i < curIdx ? RC.crimson : '#E0E0E0' }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 text-xs mb-4" style={{ color: RC.textMuted }}>
                      <span className="w-3.5 text-center">·</span>
                      <span className="flex-1">Assigned</span>
                      <span className="flex-1">In Transit</span>
                      <span className="flex-1 text-right">Delivered</span>
                    </div>

                    {task.status !== 'DELIVERED' && next && (
                      <button onClick={() => advance(task.id, next)}
                        className="w-full py-3 rounded-xl font-black text-sm transition-all"
                        style={{ backgroundColor: next==='DELIVERED' ? RC.greenDark : RC.crimson, color:'#fff' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        {next==='IN_TRANSIT' ? '🚚 Mark as In Transit' : '✅ Mark as Delivered'}
                      </button>
                    )}
                    {task.status === 'DELIVERED' && (
                      <div className="text-center py-2 font-black text-sm" style={{ color: RC.greenDark }}>
                        ✅ Delivery completed successfully
                      </div>
                    )}
                  </div>
                </RCCard>
              );
            })}
          </div>
        )}
      </main>

      {/* RC Foundation footer */}
      <div className="text-center py-4 text-xs" style={{ color: RC.textMuted }}>
        R C Foundation · Always Ready to Help You · Reg. No. E-13086
      </div>
    </div>
  );
}
