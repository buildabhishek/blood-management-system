import NotificationBell from './NotificationBell';
import RCLogo from './RCLogo';
import { RC } from './RCTheme';

export default function RCSidebar({ role, entityName, tabs, activeTab, onTabChange, onLogout }) {
  const roleLabel = {
    HOSPITAL:   { icon: '🏥', label: 'Hospital Portal' },
    BLOOD_BANK: { icon: '🩸', label: 'Blood Bank Portal' },
    RIDER:      { icon: '🏍', label: 'Rider Portal' },
    ADMIN:      { icon: '⚙️', label: 'Admin Panel' },
  }[role] || { icon: '👤', label: role };

  return (
    <aside style={{
      width: '220px', minHeight: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: RC.crimson, borderRight: `3px solid ${RC.greenDark}`,
    }}>
      {/* Logo + bell row */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 12px 12px', borderBottom: '2px solid rgba(255,255,255,0.2)',
      }}>
        <RCLogo size={56} style={{ marginBottom: '8px' }} />
        <p style={{ color: '#fff', fontWeight: 900, fontSize: '13px', textAlign: 'center', margin: 0 }}>
          R C FOUNDATION
        </p>
        <p style={{ color: RC.greenMid, fontSize: '11px', textAlign: 'center', margin: '2px 0 10px' }}>
          Always Ready to Help You
        </p>
        <NotificationBell />
      </div>

      {/* Role + entity */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontSize: '15px' }}>{roleLabel.icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            {roleLabel.label}
          </span>
        </div>
        {entityName && (
          <p style={{ fontSize: '12px', fontWeight: 700, color: RC.green, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entityName}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => onTabChange(tab.key)}
            style={{
              width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
              gap: '8px', padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
              border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              transition: 'all 0.15s',
              ...(activeTab === tab.key
                ? { backgroundColor: '#fff', color: RC.crimson, fontWeight: 700 }
                : { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)' }),
            }}
            onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <span style={{ fontSize: '15px' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <p style={{ fontSize: '11px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>
          Reg. No. E-13086
        </p>
        <button onClick={onLogout} style={{
          width: '100%', padding: '8px', borderRadius: '10px', border: 'none',
          backgroundColor: RC.greenDark, color: '#fff', fontWeight: 700,
          fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.green}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = RC.greenDark}>
          Logout
        </button>
      </div>
    </aside>
  );
}
