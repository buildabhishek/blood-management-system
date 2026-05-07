import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api/api';
import { RC } from './RCTheme';

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export default function NotificationBell() {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState([]);
  const [unread,  setUnread]  = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const fetchCount = useCallback(async () => {
    try { const d = await apiFetch('/notifications/unread-count'); setUnread(d?.count ?? 0); } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 20000);
    return () => clearInterval(t);
  }, [fetchCount]);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleOpen = async () => {
    const next = !open; setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const d = await apiFetch('/notifications');
        setNotifs(d || []);
        await apiFetch('/notifications/mark-all-read', { method: 'PUT' });
        setUnread(0);
      } catch {} finally { setLoading(false); }
    }
  };

  return (
    // KEY FIX: position:static on the wrapper — the dropdown uses a portal-like
    // fixed position so it is NEVER clipped by overflow:hidden or z-index on parents.
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          position: 'relative',
          background: open ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
          border: `1.5px solid ${open ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'}`,
          borderRadius: '10px', padding: '7px 10px', cursor: 'pointer',
          color: '#fff', fontSize: '18px', lineHeight: 1,
          transition: 'all 0.15s', display: 'flex', alignItems: 'center',
        }}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-7px', right: '-7px',
            background: RC.green, color: '#fff', borderRadius: '50%',
            width: '20px', height: '20px', fontSize: '10px', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff', lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        // KEY FIX: fixed position so the panel is never clipped by sidebar overflow.
        // Uses a ResizeObserver trick — we calculate position from the button's
        // bounding rect and render via fixed coords.
        <NotificationPanel
          notifs={notifs}
          loading={loading}
          triggerRef={ref}
        />
      )}
    </div>
  );
}

// Renders the dropdown at a fixed screen position relative to the bell button.
// This prevents it from being clipped by overflow:hidden on the sidebar.
function NotificationPanel({ notifs, loading, triggerRef }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const calc = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      // Position below the button, right-aligned
      setPos({
        top:  r.bottom + 8,
        left: Math.max(8, r.right - 340),  // 340 = panel width; clamp to 8px from left edge
      });
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('scroll', calc, true); };
  }, [triggerRef]);

  return (
    <div style={{
      position: 'fixed',
      top:  pos.top,
      left: pos.left,
      zIndex: 99999,
      width: '340px',
      maxHeight: '480px',
      overflowY: 'auto',
      background: '#fff',
      borderRadius: '14px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
      border: `1.5px solid ${RC.crimsonLight}`,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: RC.pinkBg,
        borderBottom: `2px solid ${RC.crimsonLight}`,
        borderRadius: '12px 12px 0 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 1,
      }}>
        <span style={{ fontWeight: 900, color: RC.crimson, fontSize: '14px' }}>🔔 Notifications</span>
        {notifs.length > 0 && (
          <span style={{ fontSize: '11px', color: RC.textMuted, fontWeight: 600 }}>
            {notifs.filter(n => !n.read).length > 0
              ? `${notifs.filter(n => !n.read).length} unread`
              : `${notifs.length} total`}
          </span>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{
            width: '32px', height: '32px', margin: '0 auto 10px',
            border: '3px solid #E0E0E0', borderTop: `3px solid ${RC.crimson}`,
            borderRadius: '50%', animation: 'notif-spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes notif-spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: RC.textMuted, fontSize: '13px', margin: 0 }}>Loading…</p>
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔕</div>
          <p style={{ color: RC.textMid, fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>All caught up!</p>
          <p style={{ color: RC.textMuted, fontSize: '12px', margin: 0 }}>No notifications yet</p>
        </div>
      ) : (
        notifs.map((n, i) => (
          <div
            key={n.id}
            style={{
              padding: '12px 16px',
              borderBottom: i < notifs.length - 1 ? `1px solid ${RC.pinkSoft}` : 'none',
              background: n.read ? '#fff' : RC.pinkSoft,
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: RC.textDark, margin: 0, flex: 1, lineHeight: 1.4 }}>
                {n.title}
              </p>
              {!n.read && (
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: RC.crimson, flexShrink: 0, marginTop: '4px',
                }} />
              )}
            </div>
            <p style={{ fontSize: '12px', color: RC.textMid, margin: '4px 0 0', lineHeight: 1.5 }}>{n.message}</p>
            <p style={{ fontSize: '11px', color: RC.textMuted, margin: '4px 0 0' }}>{timeAgo(n.createdAt)}</p>
          </div>
        ))
      )}
    </div>
  );
}
