import { useState } from "react";
import { apiFetch } from "../api/api";
import RCLogo from "../components/RCLogo";
import { RC } from "../components/RCTheme";

const ROLES = [
  { value: "HOSPITAL",   label: "Hospital",   icon: "🏥" },
  { value: "BLOOD_BANK", label: "Blood Bank", icon: "🩸" },
  { value: "RIDER",      label: "Rider",       icon: "🏍" },
];

export default function Login({ onLogin }) {
  const [mode, setMode]         = useState("login");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", password: "", role: "HOSPITAL",
    entityName: "", address: "", latitude: "", longitude: "",
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!form.phone || !form.password) { setError("Phone and password are required."); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        await apiFetch("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            name: form.name, phone: form.phone, password: form.password, role: form.role,
            entityName: form.entityName || null, address: form.address || null,
            latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
            longitude: form.longitude ? parseFloat(form.longitude) : null,
          }),
        });
        setMode("login");
        setSuccess("✅ Account created! Please sign in.");
        setForm(f => ({ ...f, password: "" }));
        return;
      }
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ phone: form.phone, password: form.password }),
      });
      localStorage.setItem("token",        data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("role",         data.role);
      localStorage.setItem("phone",        form.phone);
      if (data.entityName) localStorage.setItem("entityName", data.entityName);
      onLogin({ token: data.token, role: data.role, phone: form.phone });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: RC.pinkSoft }}>
      {/* Left panel — RC brand */}
      <div className="hidden md:flex flex-col items-center justify-center w-2/5 px-10"
        style={{ backgroundColor: RC.crimson }}>
        {/* Green top stripe */}
        <div className="absolute top-0 left-0 w-2/5 h-2" style={{ backgroundColor: RC.green }} />

        <RCLogo size={120} className="mb-6 drop-shadow-xl" />
        <h1 className="text-white text-3xl font-black text-center leading-tight mb-2">
          R C FOUNDATION
        </h1>
        <p className="text-sm font-semibold text-center mb-1" style={{ color: RC.green }}>
          Always Ready to Help You
        </p>
        <p className="text-xs text-center opacity-60 text-white mb-8">Reg. No. E-13086</p>

        <div className="rounded-2xl px-6 py-5 text-center max-w-xs"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p className="text-white text-sm font-medium italic mb-3">
            "Your Health, Our Commitment!"
          </p>
          <p className="text-xs opacity-75 text-white">
            Saving lives through smarter blood donation — connecting donors, hospitals & hope across Mumbai
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs opacity-50 text-white">📞 +91 82681 62360</p>
          <p className="text-xs opacity-50 text-white">rcfoundation1103@gmail.com</p>
        </div>

        {/* Green bottom stripe */}
        <div className="absolute bottom-0 left-0 w-2/5 h-2" style={{ backgroundColor: RC.green }} />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-3 mb-8">
          <RCLogo size={48} />
          <div>
            <p className="font-black text-lg" style={{ color: RC.crimson }}>R C FOUNDATION</p>
            <p className="text-xs" style={{ color: RC.greenDark }}>Always Ready to Help You</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-2xl font-black mb-1" style={{ color: RC.textDark }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm mb-6" style={{ color: RC.textMuted }}>
            {mode === 'login' ? 'Sign in to BloodMS Portal' : 'Register your organization'}
          </p>

          {/* Mode tabs */}
          <div className="flex mb-6 rounded-xl overflow-hidden"
            style={{ border: `2px solid ${RC.crimson}` }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className="flex-1 py-2.5 text-sm font-bold transition-all"
                style={mode === m
                  ? { backgroundColor: RC.crimson, color: '#fff' }
                  : { backgroundColor: '#fff', color: RC.crimson }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Role picker (register only) */}
          {mode === 'register' && (
            <div className="mb-5">
              <p className="text-xs font-semibold mb-2" style={{ color: RC.textMid }}>Register as</p>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className="p-3 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold transition-all"
                    style={form.role === r.value
                      ? { backgroundColor: RC.crimson, color: '#fff', border: `2px solid ${RC.crimsonDark}` }
                      : { backgroundColor: '#fff', color: RC.textMid, border: `2px solid #E0E0E0` }}>
                    <span className="text-xl">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {mode === 'register' && (
              <RCInput label="Full Name" value={form.name} onChange={set("name")} placeholder="Your full name" />
            )}
            <RCInput label="Phone Number" value={form.phone} onChange={set("phone")} placeholder="10-digit mobile number" />
            <RCInput label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Minimum 6 characters" />

            {mode === 'register' && (form.role === 'HOSPITAL' || form.role === 'BLOOD_BANK') && (
              <>
                <RCInput
                  label={form.role === 'HOSPITAL' ? 'Hospital Name' : 'Blood Bank Name'}
                  value={form.entityName} onChange={set("entityName")}
                  placeholder="Official registered name" />
                <RCInput label="Address (optional)" value={form.address} onChange={set("address")} placeholder="Full address" />
                <div className="grid grid-cols-2 gap-2">
                  <RCInput label="Latitude" type="number" value={form.latitude} onChange={set("latitude")} placeholder="e.g. 19.0760" />
                  <RCInput label="Longitude" type="number" value={form.longitude} onChange={set("longitude")} placeholder="e.g. 72.8777" />
                </div>
                <p className="text-xs" style={{ color: RC.textMuted }}>
                  📍 Coordinates enable distance-based blood search for hospitals
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl text-sm"
              style={{ backgroundColor: '#FDE8F0', border: `1px solid ${RC.crimsonLight}`, color: RC.crimson }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 rounded-xl text-sm"
              style={{ backgroundColor: RC.greenLight, border: `1px solid ${RC.greenMid}`, color: RC.greenDark }}>
              {success}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-5 py-3 rounded-xl font-black text-sm tracking-wide transition-all active:scale-[0.98]"
            style={{ backgroundColor: loading ? '#E0E0E0' : RC.crimson, color: '#fff' }}>
            {loading ? 'Processing...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>

          {mode === 'login' && (
            <p className="text-center text-xs mt-4" style={{ color: RC.textMuted }}>
              Authorized personnel only · RC Foundation BloodMS
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RCInput({ label, ...props }) {
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: RC.textMid }}>{label}</label>
      <input {...props}
        className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          backgroundColor: '#fff',
          border: `1.5px solid #E0E0E0`,
          color: RC.textDark,
        }}
        onFocus={e => e.target.style.borderColor = RC.crimson}
        onBlur={e => e.target.style.borderColor = '#E0E0E0'}
      />
    </div>
  );
}
