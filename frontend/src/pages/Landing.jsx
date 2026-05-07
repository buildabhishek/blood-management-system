import { useNavigate } from 'react-router-dom';
import RCLogo from '../components/RCLogo';
import { RC } from '../components/RCTheme';

export default function Landing() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight:'100vh', backgroundColor: RC.pinkSoft, display:'flex', flexDirection:'column' }}>
      {/* Top bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', backgroundColor: RC.green, zIndex:10 }} />

      {/* Hero */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'60px 24px', textAlign:'center' }}>
        <RCLogo size={100} style={{ marginBottom:'20px' }} />
        <h1 style={{ fontSize:'32px', fontWeight:900, color: RC.crimson, margin:'0 0 6px' }}>
          R C FOUNDATION
        </h1>
        <p style={{ fontSize:'16px', fontWeight:700, color: RC.greenDark, margin:'0 0 4px' }}>
          Always Ready to Help You
        </p>
        <p style={{ fontSize:'12px', color: RC.textMuted, margin:'0 0 32px' }}>Reg. No. E-13086</p>

        <div style={{ maxWidth:'600px', marginBottom:'40px' }}>
          <h2 style={{ fontSize:'22px', fontWeight:900, color: RC.textDark, margin:'0 0 12px' }}>
            Blood Management System
          </h2>
          <p style={{ fontSize:'14px', color: RC.textMid, lineHeight:'1.7', margin:0 }}>
            A real-time, multi-role platform connecting hospitals, blood banks, and riders
            to ensure blood reaches patients faster — eliminating manual phone calls and delays.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
          gap:'14px', maxWidth:'700px', width:'100%', marginBottom:'40px' }}>
          {[
            { icon:'🏥', title:'Hospital Portal',  desc:'Search availability, raise requests, track delivery in real time.' },
            { icon:'🩸', title:'Blood Bank',        desc:'Manage inventory, donors, camps, and incoming requests.' },
            { icon:'🏍', title:'Rider App',         desc:'Get task assignments, navigate, and confirm deliveries via OTP.' },
            { icon:'⚙️', title:'Admin Panel',       desc:'Full system monitoring, user management, and analytics.' },
          ].map(f => (
            <div key={f.title} style={{ padding:'20px 16px', borderRadius:'14px', backgroundColor:'#fff',
              border:`1.5px solid ${RC.crimsonLight}`, textAlign:'center' }}>
              <div style={{ fontSize:'32px', marginBottom:'8px' }}>{f.icon}</div>
              <p style={{ fontWeight:800, color: RC.crimson, margin:'0 0 6px', fontSize:'14px' }}>{f.title}</p>
              <p style={{ fontSize:'12px', color: RC.textMuted, margin:0, lineHeight:'1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <button onClick={() => nav('/login')}
          style={{ padding:'14px 48px', borderRadius:'14px', fontWeight:900, fontSize:'15px',
            backgroundColor: RC.crimson, color:'#fff', border:'none', cursor:'pointer',
            boxShadow:'0 6px 20px rgba(194,23,91,0.35)', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.crimsonDark}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = RC.crimson}>
          Sign In to Portal →
        </button>

        <p style={{ marginTop:'16px', fontSize:'12px', color: RC.textMuted }}>
          Authorised personnel only · RC Foundation BloodMS v2.0
        </p>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: RC.crimson, padding:'16px 24px', textAlign:'center',
        borderTop:`3px solid ${RC.greenDark}` }}>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', margin:'0 0 4px' }}>
          📞 +91 82681 62360 · rcfoundation1103@gmail.com · Dombivli, Maharashtra
        </p>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', margin:0 }}>
          © 2026 RC Foundation · Blood Management System · Reg. E-13086
        </p>
      </footer>
    </div>
  );
}
