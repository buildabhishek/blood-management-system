import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api/api';
import { RC } from './RCTheme';

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const data = await apiFetch('/notifications/unread-count');
      setUnread(data?.count ?? 0);
    } catch {}
  }, []);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/notifications');
      setNotifs(data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Poll unread count every 15s
  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 15000);
    return () => clearInterval(t);
  }, [fetchCount]);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await fetchNotifs();
      // Mark all read
      try {
        await apiFetch('/notifications/mark-all-read', { method: 'PUT' });
        setUnread(0);
      } catch {}
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', background: 'rgba(255,255,255,0.15)',
          border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '10px',
          padding: '7px 10px', cursor: 'pointer', color: '#fff', fontSize: '18px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            background: RC.green, color: '#fff',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '10px', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${RC.crimson}`,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '44px', right: 0, zIndex: 1000,
          width: '340px', maxHeight: '480px', overflowY: 'auto',
          background: '#fff', borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: `1.5px solid ${RC.crimsonLight}`,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: `2px solid ${RC.crimsonLight}`,
            background: RC.pinkBg, borderRadius: '12px 12px 0 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 900, color: RC.crimson, fontSize: '14px' }}>
              🔔 Notifications
            </span>
            {notifs.length > 0 && (
              <span style={{ fontSize: '11px', color: RC.textMuted }}>{notifs.length} total</span>
            )}
          </div>

          {/* Items */}
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: RC.textMuted, fontSize: '13px' }}>
              Loading...
            </div>
          ) : notifs.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
              <p style={{ color: RC.textMuted, fontSize: '13px' }}>No notifications yet</p>
            </div>
          ) : (
            notifs.map(n => (
              <div key={n.id} style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${RC.pinkSoft}`,
                background: n.read ? '#fff' : RC.pinkSoft,
                transition: 'background 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: RC.textDark, margin: 0, flex: 1 }}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: RC.crimson, flexShrink: 0, marginTop: '4px',
                    }} />
                  )}
                </div>
                <p style={{ fontSize: '12px', color: RC.textMid, margin: '3px 0 0', lineHeight: '1.4' }}>
                  {n.message}
                </p>
                <p style={{ fontSize: '11px', color: RC.textMuted, margin: '4px 0 0' }}>
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
