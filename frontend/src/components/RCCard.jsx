import { RC } from './RCTheme';

const VARIANTS = {
  white:  { bg: '#FFFFFF',      border: RC.border     },
  pink:   { bg: RC.pinkBg,      border: RC.crimsonLight },
  green:  { bg: RC.greenLight,  border: RC.greenMid   },
  yellow: { bg: RC.cardYellow,  border: '#FFD54F'     },
  blue:   { bg: RC.cardBlue,    border: '#90CAF9'     },
  orange: { bg: RC.cardOrange,  border: '#FFCC80'     },
};

export default function RCCard({ variant = 'white', style = {}, children, onClick }) {
  const v = VARIANTS[variant] || VARIANTS.white;
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: v.bg,
        border: `1.5px solid ${v.border}`,
        borderRadius: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, transform 0.15s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; } : undefined}
    >
      {children}
    </div>
  );
}
