import NotificationBell from './NotificationBell';
import RCLogo from './RCLogo';
import { RC } from './RCTheme';

const ROLE_META = {
  HOSPITAL:   { icon: '🏥', label: 'Hospital Portal'   },
  BLOOD_BANK: { icon: '🩸', label: 'Blood Bank Portal' },
  ADMIN:      { icon: '⚙️', label: 'Admin Panel'        },
  RIDER:      { icon: '🏍', label: 'Rider Portal'       },
};

export default function RCSidebar({ role, entityName, tabs, activeTab, onTabChange, onLogout }) {
  const meta = ROLE_META[role] || { icon: '👤', label: role };

  return (
    <aside style={{
      width: '224px', minWidth: '224px', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      backgroundColor: RC.crimson,
      borderRight: `3px solid ${RC.greenDark}`,
      flexShrink: 0,
      // KEY FIX: overflow must NOT be hidden — NotificationBell needs to escape
      overflow: 'visible',
      position: 'relative', zIndex: 200,
    }}>

      {/* Logo + Notification Bell */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 14px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.18)',
      }}>
        <RCLogo size={54} style={{ marginBottom: '8px' }} />
        <p style={{ color: '#fff', fontWeight: 900, fontSize: '13px', textAlign: 'center', margin: '0 0 2px', letterSpacing: '0.5px' }}>
          R C FOUNDATION
        </p>
        <p style={{ color: RC.greenMid, fontSize: '10px', textAlign: 'center', margin: '0 0 14px', opacity: 0.9 }}>
          Always Ready to Help You
        </p>
        {/* NotificationBell now renders with fixed-position dropdown — safe here */}
        <NotificationBell />
      </div>

      {/* Role badge */}
      <div style={{
        padding: '10px 14px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ fontSize: '14px' }}>{meta.icon}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {meta.label}
          </span>
        </div>
        {entityName && (
          <p style={{
            fontSize: '12px', fontWeight: 700, color: RC.greenMid, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entityName}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px' }}>
        {tabs.map(t => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              style={{
                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                gap: '9px', padding: '10px 12px', borderRadius: '10px', marginBottom: '3px',
                border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 700 : 500,
                transition: 'all 0.15s',
                backgroundColor: active ? '#fff' : 'transparent',
                color: active ? RC.crimson : 'rgba(255,255,255,0.85)',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{t.icon}</span>
              <span style={{ flex: 1 }}>{t.label}</span>
              {t.badge > 0 && (
                <span style={{
                  backgroundColor: active ? RC.crimson : RC.green,
                  color: '#fff', borderRadius: '10px', padding: '1px 6px',
                  fontSize: '10px', fontWeight: 900, lineHeight: '16px',
                }}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <p style={{ fontSize: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px' }}>
          Reg. No. E-13086
        </p>
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: '8px', borderRadius: '10px', border: 'none',
            backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)',
            fontWeight: 700, fontSize: '12px', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = RC.greenDark; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
        >
          ↩ Logout
        </button>
      </div>
    </aside>
  );
}
