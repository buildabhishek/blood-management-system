import { useEffect, useState } from 'react';
import { RC } from './RCTheme';

export default function RCToast({ msg, type = 'success', onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the enter animation fires
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, []);

  const isError = type === 'error';

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 999999,
      maxWidth: '380px', minWidth: '260px',
      backgroundColor: isError ? '#FDECEC' : '#EBF7EE',
      border: `1.5px solid ${isError ? RC.crimson : RC.green}`,
      borderRadius: '14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
      opacity: visible ? 1 : 0,
      transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>
        {isError ? '❌' : '✅'}
      </span>
      <p style={{
        flex: 1, margin: 0, fontSize: '13px', fontWeight: 600,
        color: isError ? RC.crimsonDark : RC.greenDark, lineHeight: 1.5,
      }}>
        {msg}
      </p>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
          color: isError ? RC.crimson : RC.greenDark, fontSize: '16px', lineHeight: 1,
          flexShrink: 0, opacity: 0.7,
        }}
      >×</button>
    </div>
  );
}
