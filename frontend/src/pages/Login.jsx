import { useState } from 'react';
import { apiFetch } from '../api/api';
import RCLogo from '../components/RCLogo';
import { RC } from '../components/RCTheme';

const ROLES = [
  { value: 'HOSPITAL',   label: 'Hospital',   icon: '🏥' },
  { value: 'BLOOD_BANK', label: 'Blood Bank', icon: '🩸' },
  { value: 'RIDER',      label: 'Rider',       icon: '🏍' },
];

function validate(mode, form) {
  const e = {};
  if (mode === 'register') {
    if (!form.name || form.name.trim().length < 2) e.name = 'Full name must be at least 2 characters.';
  }
  if (!form.phone || !/^[0-9]{10,15}$/.test(form.phone.trim())) e.phone = 'Phone must be 10–15 digits.';
  if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters.';
  if (mode === 'register' && (form.role === 'HOSPITAL' || form.role === 'BLOOD_BANK')) {
    if (!form.entityName || form.entityName.trim().length < 2)
      e.entityName = `${form.role === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'} name is required.`;
  }
  return e;
}

const inp = (err) => ({
  width: '100%', padding: '10px 14px', borderRadius: '10px', outline: 'none', fontSize: '13px',
  border: `1.5px solid ${err ? RC.crimson : '#E0E0E0'}`, color: RC.textDark, backgroundColor: '#fff',
  boxSizing: 'border-box',
});

export default function Login({ onLogin }) {
  const [mode,    setMode]    = useState('login');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [fErrs,   setFErrs]   = useState({});
  const [success, setSuccess] = useState('');
  const [form,    setForm]    = useState({ name:'', phone:'', password:'', role:'HOSPITAL',
    entityName:'', address:'', latitude:'', longitude:'', vehicleType:'', vehiclePlate:'', assignedZone:'' });

  const set = k => e => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (fErrs[k]) setFErrs(fe => { const n={...fe}; delete n[k]; return n; });
    if (err) setErr('');
  };

  const switchMode = m => { setMode(m); setErr(''); setFErrs({}); setSuccess(''); };

  const submit = async e => {
    e.preventDefault();
    const errs = validate(mode, form);
    if (Object.keys(errs).length) { setFErrs(errs); return; }
    setFErrs({}); setErr(''); setLoading(true);
    try {
      if (mode === 'register') {
        await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({
          name: form.name.trim(), phone: form.phone.trim(), password: form.password,
          role: form.role, entityName: form.entityName.trim() || null,
          address: form.address.trim() || null,
          latitude:  form.latitude  ? parseFloat(form.latitude)  : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          vehicleType:  form.vehicleType  || null,
          vehiclePlate: form.vehiclePlate || null,
          assignedZone: form.assignedZone || null,
        }) });
        switchMode('login');
        setSuccess('✅ Account created! You can now sign in.');
        setForm(f => ({ ...f, password:'', name:'', entityName:'', address:'' }));
        return;
      }
      const data = await apiFetch('/auth/login', { method: 'POST',
        body: JSON.stringify({ phone: form.phone.trim(), password: form.password }) });
      localStorage.setItem('token',        data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('role',         data.role);
      localStorage.setItem('phone',        data.phone || form.phone.trim());
      localStorage.setItem('name',         data.name || '');
      if (data.entityName)  localStorage.setItem('entityName',  data.entityName);
      if (data.assignedZone)localStorage.setItem('assignedZone',data.assignedZone);
      onLogin({ token: data.token, role: data.role });
    } catch (ex) {
      setErr(ex.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: RC.pinkSoft }}>

      {/* Left brand panel */}
      <div className="hidden md:flex" style={{ width: '40%', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '40px', backgroundColor: RC.crimson, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: RC.green }} />
        <RCLogo size={110} style={{ marginBottom: '20px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
        <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 900, textAlign: 'center', margin: '0 0 6px' }}>
          R C FOUNDATION
        </h1>
        <p style={{ color: RC.greenMid, fontWeight: 700, fontSize: '14px', textAlign: 'center', margin: '0 0 4px' }}>
          Always Ready to Help You
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 28px' }}>Reg. No. E-13086</p>
        <div style={{ borderRadius: '14px', padding: '20px', textAlign: 'center', maxWidth: '280px',
          backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ color: '#fff', fontSize: '13px', fontStyle: 'italic', margin: '0 0 8px' }}>
            "Your Health, Our Commitment!"
          </p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: 0 }}>
            Connecting donors, hospitals and hope across Mumbai
          </p>
        </div>
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '2px 0' }}>📞 +91 82681 62360</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '2px 0' }}>rcfoundation1103@gmail.com</p>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: RC.green }} />
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}
          className="flex md:hidden">
          <RCLogo size={44} />
          <div>
            <p style={{ fontWeight: 900, color: RC.crimson, margin: 0 }}>R C FOUNDATION</p>
            <p style={{ fontSize: '11px', color: RC.greenDark, margin: 0 }}>Always Ready to Help You</p>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '22px', color: RC.textDark, margin: '0 0 4px' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ fontSize: '13px', color: RC.textMuted, margin: '0 0 20px' }}>
            {mode === 'login' ? 'Sign in to BloodMS Portal' : 'Register your organisation'}
          </p>

          {/* Mode tabs */}
          <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden',
            border: `2px solid ${RC.crimson}`, marginBottom: '20px' }}>
            {['login','register'].map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                style={{ flex: 1, padding: '10px', fontWeight: 700, fontSize: '13px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: mode===m ? RC.crimson : '#fff',
                  color: mode===m ? '#fff' : RC.crimson }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Role picker for register */}
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: RC.textMid, margin: '0 0 8px' }}>Register as</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => { setForm(f=>({...f,role:r.value})); setFErrs({}); }}
                    style={{ padding: '10px 6px', borderRadius: '10px', border: '2px solid',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                      backgroundColor: form.role===r.value ? RC.crimson : '#fff',
                      color: form.role===r.value ? '#fff' : RC.textMid,
                      borderColor: form.role===r.value ? RC.crimsonDark : '#E0E0E0' }}>
                    <span style={{ fontSize: '20px' }}>{r.icon}</span>{r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {mode === 'register' && (
                <F label="Full Name" err={fErrs.name}>
                  <input value={form.name} onChange={set('name')} placeholder="Your full name" style={inp(fErrs.name)} />
                </F>
              )}

              <F label="Phone Number" err={fErrs.phone}>
                <input value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" inputMode="numeric" style={inp(fErrs.phone)} />
              </F>

              <F label="Password" err={fErrs.password}>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Minimum 6 characters" style={inp(fErrs.password)} />
              </F>

              {mode === 'register' && (form.role === 'HOSPITAL' || form.role === 'BLOOD_BANK') && (
                <>
                  <F label={form.role==='HOSPITAL' ? 'Hospital Name' : 'Blood Bank Name'} err={fErrs.entityName}>
                    <input value={form.entityName} onChange={set('entityName')} placeholder="Official registered name" style={inp(fErrs.entityName)} />
                  </F>
                  <F label="Address (optional)">
                    <input value={form.address} onChange={set('address')} placeholder="Full address" style={inp(false)} />
                  </F>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <F label="Latitude"><input type="number" value={form.latitude} onChange={set('latitude')} placeholder="e.g. 19.0760" style={inp(false)} /></F>
                    <F label="Longitude"><input type="number" value={form.longitude} onChange={set('longitude')} placeholder="e.g. 72.8777" style={inp(false)} /></F>
                  </div>
                  <p style={{ fontSize: '11px', color: RC.textMuted, margin: 0 }}>📍 Coordinates enable distance-based search</p>
                </>
              )}

              {mode === 'register' && form.role === 'RIDER' && (
                <>
                  <F label="Vehicle Type">
                    <select value={form.vehicleType} onChange={set('vehicleType')} style={inp(false)}>
                      <option value="">Select vehicle type</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Car">Car</option>
                      <option value="Van">Van</option>
                    </select>
                  </F>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <F label="Vehicle Plate">
                      <input value={form.vehiclePlate} onChange={set('vehiclePlate')} placeholder="MH 02 AB 1234" style={inp(false)} />
                    </F>
                    <F label="Assigned Zone">
                      <input value={form.assignedZone} onChange={set('assignedZone')} placeholder="e.g. Dombivli" style={inp(false)} />
                    </F>
                  </div>
                </>
              )}
            </div>

            {success && (
              <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', fontSize: '13px',
                backgroundColor: RC.greenLight, border: `1.5px solid ${RC.greenMid}`, color: RC.greenDark }}>
                {success}
              </div>
            )}

            {err && (
              <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px',
                backgroundColor: '#FDE8F0', border: `1.5px solid ${RC.crimson}`, color: RC.crimson }}>
                <p style={{ fontWeight: 700, fontSize: '13px', margin: '0 0 4px' }}>
                  ⚠️ {mode==='login' ? 'Sign in failed' : 'Registration failed'}
                </p>
                {err.split('\n').map((l, i) => <p key={i} style={{ fontSize: '12px', margin: '2px 0 0' }}>{l}</p>)}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', marginTop: '18px', padding: '13px', borderRadius: '12px',
                fontWeight: 900, fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: loading ? '#C0C0C0' : RC.crimson, color: '#fff', opacity: loading ? 0.75 : 1 }}>
              {loading ? (mode==='login' ? 'Signing in…' : 'Creating account…')
                       : (mode==='login' ? 'SIGN IN' : 'CREATE ACCOUNT')}
            </button>
          </form>

          {mode === 'login' && (
            <p style={{ textAlign: 'center', fontSize: '11px', marginTop: '14px', color: RC.textMuted }}>
              Authorised personnel only · RC Foundation BloodMS
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, err, children }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', color: RC.textMid }}>
        {label}
      </label>
      {children}
      {err && <p style={{ fontSize: '11px', marginTop: '3px', color: RC.crimson, fontWeight: 600 }}>⚠ {err}</p>}
    </div>
  );
}
