import { RC } from './RCTheme';

export default function RCCard({
  children,
  variant = 'pink',
  className = '',
  style = {},
}) {
  const bgMap = {
    pink:   RC.pinkBg,
    green:  RC.greenLight,
    yellow: RC.cardYellow,
    blue:   RC.cardBlue,
    orange: RC.cardOrange,
    white:  '#FFFFFF',
  };

  const borderMap = {
    pink:   RC.crimsonLight,
    green:  RC.greenMid,
    yellow: '#FFD54F',
    blue:   '#90CAF9',
    orange: '#FFCC80',
    white:  '#E0E0E0',
  };

  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        backgroundColor: bgMap[variant] || bgMap.pink,

        // ✅ FIX: no shorthand anymore
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: borderMap[variant] || borderMap.pink,

        ...style, // safe now ✅
      }}
    >
      {children}
    </div>
  );
}
