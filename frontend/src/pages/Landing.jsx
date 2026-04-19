import { useNavigate } from "react-router-dom";
import RCLogo from "../components/RCLogo";
import { RC } from "../components/RCTheme";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: RC.pinkSoft }}>
      {/* Green top stripe */}
      <div className="h-2 w-full" style={{ backgroundColor: RC.green }} />

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4"
        style={{ backgroundColor: '#fff', borderBottom: `1px solid ${RC.crimsonLight}` }}>
        <div className="flex items-center gap-3">
          <RCLogo size={44} />
          <div>
            <p className="font-black" style={{ color: RC.crimson }}>R C FOUNDATION</p>
            <p className="text-xs" style={{ color: RC.greenDark }}>Always Ready to Help You</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ border: `2px solid ${RC.crimson}`, color: RC.crimson, backgroundColor: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.pinkBg}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}>
            Login
          </button>
          <button onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{ backgroundColor: RC.crimson, color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = RC.crimsonDark}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = RC.crimson}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-20 px-6">
        <div className="flex justify-center mb-6">
          <RCLogo size={96} />
        </div>
        <h1 className="text-4xl font-black mb-3" style={{ color: RC.crimson }}>
          R C FOUNDATION BloodMS
        </h1>
        <p className="text-xl font-semibold mb-2" style={{ color: RC.greenDark }}>
          "Your Health, Our Commitment!"
        </p>
        <p className="max-w-xl mx-auto mb-8 text-sm" style={{ color: RC.textMid }}>
          Saving lives through smarter blood donation — connecting donors, hospitals and hope across Mumbai
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => navigate("/login")}
            className="px-8 py-3 rounded-xl font-black text-sm transition-all"
            style={{ backgroundColor: RC.crimson, color: '#fff' }}>
            Access Blood Portal
          </button>
          <a href="tel:+918268162360"
            className="px-8 py-3 rounded-xl font-black text-sm transition-all"
            style={{ border: `2px solid ${RC.greenDark}`, color: RC.greenDark, backgroundColor: RC.greenLight }}>
            📞 Call Helpline
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-center text-2xl font-black mb-8" style={{ color: RC.crimson }}>
          What We Offer
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon:'🔍', title:'Find Blood Fast', desc:'Search nearby blood banks instantly with real-time availability across all 450+ partner hospitals in Mumbai.', variant:'pink' },
            { icon:'🩸', title:'Smart Inventory', desc:'Blood banks manage stock with expiry tracking, blood group alerts and automated shortage notifications.', variant:'green' },
            { icon:'🚚', title:'Fast Delivery', desc:'Trained riders with cold-chain vehicles ensuring safe, fast blood delivery to hospitals across Mumbai.', variant:'yellow' },
            { icon:'🏕️', title:'Donation Camps', desc:'Organizing large-scale donation camps across corporate offices, IT parks, schools and NGOs throughout Mumbai.', variant:'blue' },
            { icon:'🔔', title:'24/7 Notifications', desc:'Real-time push notifications for blood request status updates — from acceptance to delivery confirmation.', variant:'pink' },
            { icon:'📊', title:'Analytics Dashboard', desc:'Hospital-wise data, monthly reports and impact tracking — full transparency in blood supply operations.', variant:'green' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl p-6"
              style={{ backgroundColor: f.variant==='pink'?RC.pinkBg:f.variant==='green'?RC.greenLight:f.variant==='yellow'?RC.cardYellow:RC.cardBlue,
                border: `1.5px solid ${f.variant==='pink'?RC.crimsonLight:f.variant==='green'?RC.greenMid:f.variant==='yellow'?'#FFD54F':'#90CAF9'}` }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-black text-base mb-2" style={{ color: RC.textDark }}>{f.title}</h3>
              <p className="text-sm" style={{ color: RC.textMid }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact numbers */}
      <section className="py-12 px-6" style={{ backgroundColor: RC.crimson }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[['450+','Partner Hospitals'],['8','Blood Storage Centres'],['24/7','Donor Helpline'],['12M+','Mumbai Population Served']].map(([v,l]) => (
            <div key={l}>
              <div className="text-3xl font-black">{v}</div>
              <div className="text-xs mt-1 opacity-80">{l}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-white text-sm mt-8 font-semibold opacity-80">
          Together, we can make Mumbai blood-secure. Every drop donated is a life saved.
        </p>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: RC.greenDark, color: '#fff' }}>
        <div className="max-w-4xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <RCLogo size={36} />
              <span className="font-black">R C FOUNDATION</span>
            </div>
            <p className="text-xs opacity-70">Reg. No. E-13086 · Government Registered Trust</p>
          </div>
          <div>
            <p className="font-black mb-2">Contact</p>
            <p className="text-xs opacity-70">📞 +91 82681 62360 / +91 88791 00568</p>
            <p className="text-xs opacity-70">✉️ rcfoundation1103@gmail.com</p>
            <p className="text-xs opacity-70">🌐 www.rahulchaudharifoundation.com</p>
          </div>
          <div>
            <p className="font-black mb-2">Address</p>
            <p className="text-xs opacity-70">Shop No. 07, Joshi High School, Shopping Cheda Road, Kanvinde Chowk, Dombivli East</p>
          </div>
        </div>
        <div className="text-center py-3 text-xs opacity-50" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          © 2026 R C Foundation — Always Ready to Help You ❤️
        </div>
        {/* Green bottom stripe */}
        <div className="h-2" style={{ backgroundColor: RC.green }} />
      </footer>
    </div>
  );
}
