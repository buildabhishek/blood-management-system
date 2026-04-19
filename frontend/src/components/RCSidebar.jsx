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
    <aside className="flex flex-col" style={{
      width: '220px', minHeight: '100vh',
      backgroundColor: RC.crimson,
      borderRight: `3px solid ${RC.greenDark}`,
    }}>
      {/* Logo + Foundation name */}
      <div className="flex flex-col items-center py-5 px-3"
        style={{ borderBottom: `2px solid rgba(255,255,255,0.2)` }}>
        <RCLogo size={64} className="mb-2 drop-shadow-md" />
        <p className="text-white font-bold text-sm text-center leading-tight">R C FOUNDATION</p>
        <p className="text-xs text-center mt-0.5" style={{ color: RC.greenMid }}>
          Always Ready to Help You
        </p>
      </div>

      {/* Role + entity */}
      <div className="px-3 py-3" style={{ borderBottom: `1px solid rgba(255,255,255,0.15)` }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{roleLabel.icon}</span>
          <span className="text-xs font-semibold text-white opacity-80">{roleLabel.label}</span>
        </div>
        {entityName && (
          <p className="text-xs font-bold truncate" style={{ color: RC.green }}>{entityName}</p>
        )}
      </div>

      {/* Nav tabs */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => onTabChange(tab.key)}
            className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={activeTab === tab.key ? {
              backgroundColor: '#FFFFFF',
              color: RC.crimson,
              fontWeight: '700',
            } : {
              color: 'rgba(255,255,255,0.85)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3" style={{ borderTop: `1px solid rgba(255,255,255,0.15)` }}>
        <p className="text-xs text-center mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Reg. No. E-13086
        </p>
        <button onClick={onLogout}
          className="w-full py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: RC.greenDark, color: '#fff' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.green}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = RC.greenDark}>
          Logout
        </button>
      </div>
    </aside>
  );
}
