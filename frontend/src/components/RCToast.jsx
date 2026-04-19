import { useEffect } from 'react';
import { RC } from './RCTheme';

export default function RCToast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium"
      style={{
        backgroundColor: type === 'error' ? '#C2175B' : RC.greenDark,
        color: '#fff',
        border: `2px solid ${type === 'error' ? RC.crimsonLight : RC.green}`,
        minWidth: '240px',
        maxWidth: '360px',
      }}>
      <span className="text-lg">{type === 'error' ? '⚠️' : '✅'}</span>
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 ml-2 text-lg leading-none">×</button>
    </div>
  );
}
