import { useState } from 'react';
import { apiFetch } from '../api/api';
import RCLogo from '../components/RCLogo';
import { RC } from '../components/RCTheme';

const ROLES = [
    { value: 'HOSPITAL', label: 'Hospital', icon: '🏥' },
    { value: 'BLOOD_BANK', label: 'Blood Bank', icon: '🩸' },
    { value: 'RIDER', label: 'Rider', icon: '🏍' },
];

// ── client-side validation ────────────────────────────────────────────────────
function validate(mode, form) {
    const errs = {};
    if (mode === 'register') {
        if (!form.name || form.name.trim().length < 2)
            errs.name = 'Full name must be at least 2 characters.';
    }
    if (!form.phone || !/^[0-9]{10,15}$/.test(form.phone.trim()))
        errs.phone = 'Phone must be 10–15 digits (numbers only).';
    if (!form.password || form.password.length < 6)
        errs.password = 'Password must be at least 6 characters.';
    if (mode === 'register' && (form.role === 'HOSPITAL' || form.role === 'BLOOD_BANK')) {
        if (!form.entityName || form.entityName.trim().length < 2)
            errs.entityName = `${form.role === 'HOSPITAL' ? 'Hospital' : 'Blood bank'} name is required.`;
    }
    return errs;
}

export default function Login({ onLogin }) {
    const [mode, setMode] = useState('login');
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState(''); // server / network errors
    const [fieldErrors, setFieldErrors] = useState({}); // per-field client errors
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        name: '',
        phone: '',
        password: '',
        role: 'HOSPITAL',
        entityName: '',
        address: '',
        latitude: '',
        longitude: '',
    });

    const setField = (k) => (e) => {
        setForm((f) => ({ ...f, [k]: e.target.value }));
        // Clear that field's error as the user types
        if (fieldErrors[k])
            setFieldErrors((fe) => {
                const n = { ...fe };
                delete n[k];
                return n;
            });
        if (globalError) setGlobalError('');
    };

    const switchMode = (m) => {
        setMode(m);
        setGlobalError('');
        setFieldErrors({});
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Client-side validation first — never hits the server with obviously bad data
        const errs = validate(mode, form);
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }

        setFieldErrors({});
        setGlobalError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                await apiFetch('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: form.name.trim(),
                        phone: form.phone.trim(),
                        password: form.password,
                        role: form.role,
                        entityName: form.entityName.trim() || null,
                        address: form.address.trim() || null,
                        latitude: form.latitude ? parseFloat(form.latitude) : null,
                        longitude: form.longitude ? parseFloat(form.longitude) : null,
                    }),
                });
                // Success — switch to login and pre-fill phone
                switchMode('login');
                setSuccess('✅ Account created! You can now sign in.');
                setForm((f) => ({ ...f, password: '', name: '', entityName: '', address: '' }));
                return;
            }

            // ── Login ──────────────────────────────────────────────────────────────
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ phone: form.phone.trim(), password: form.password }),
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('role', data.role);
            localStorage.setItem('phone', form.phone.trim());
            if (data.name) localStorage.setItem('name', data.name);
            if (data.entityName) localStorage.setItem('entityName', data.entityName);
            onLogin({ token: data.token, role: data.role, phone: form.phone.trim() });
        } catch (err) {
            // Server returned an error — show it WITHOUT reloading
            const msg = err.message || 'Something went wrong. Please try again.';
            // If the message contains field-specific info (multiline from validation), show as global
            setGlobalError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: RC.pinkSoft }}>
            {/* ── Left brand panel ────────────────────────────────────────────────── */}
            <div
                className="hidden md:flex flex-col items-center justify-center w-2/5 px-10 relative"
                style={{ backgroundColor: RC.crimson }}
            >
                <div
                    className="absolute top-0 left-0 w-full h-2"
                    style={{ backgroundColor: RC.green }}
                />

                <RCLogo size={120} className="mb-6 drop-shadow-xl" />
                <h1 className="text-white text-3xl font-black text-center leading-tight mb-2">
                    R C FOUNDATION
                </h1>
                <p className="text-sm font-semibold text-center mb-1" style={{ color: RC.green }}>
                    Always Ready to Help You
                </p>
                <p className="text-xs text-center opacity-60 text-white mb-8">Reg. No. E-13086</p>

                <div
                    className="rounded-2xl px-6 py-5 text-center max-w-xs"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}
                >
                    <p className="text-white text-sm font-medium italic mb-3">
                        "Your Health, Our Commitment!"
                    </p>
                    <p className="text-xs opacity-75 text-white">
                        Saving lives through smarter blood donation — connecting donors, hospitals
                        &amp; hope across Mumbai
                    </p>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs opacity-50 text-white">📞 +91 82681 62360</p>
                    <p className="text-xs opacity-50 text-white">rcfoundation1103@gmail.com</p>
                </div>

                <div
                    className="absolute bottom-0 left-0 w-full h-2"
                    style={{ backgroundColor: RC.green }}
                />
            </div>

            {/* ── Right form panel ────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
                {/* Mobile logo */}
                <div className="flex md:hidden items-center gap-3 mb-8">
                    <RCLogo size={48} />
                    <div>
                        <p className="font-black text-lg" style={{ color: RC.crimson }}>
                            R C FOUNDATION
                        </p>
                        <p className="text-xs" style={{ color: RC.greenDark }}>
                            Always Ready to Help You
                        </p>
                    </div>
                </div>

                <div className="w-full max-w-md">
                    <h2 className="text-2xl font-black mb-1" style={{ color: RC.textDark }}>
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-sm mb-6" style={{ color: RC.textMuted }}>
                        {mode === 'login'
                            ? 'Sign in to BloodMS Portal'
                            : 'Register your organization'}
                    </p>

                    {/* ── Mode tabs — type="button" is mandatory to prevent accidental submit ── */}
                    <div
                        className="flex mb-6 rounded-xl overflow-hidden"
                        style={{ border: `2px solid ${RC.crimson}` }}
                    >
                        {['login', 'register'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => switchMode(m)}
                                className="flex-1 py-2.5 text-sm font-bold transition-all"
                                style={
                                    mode === m
                                        ? { backgroundColor: RC.crimson, color: '#fff' }
                                        : { backgroundColor: '#fff', color: RC.crimson }
                                }
                            >
                                {m === 'login' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    {/* ── Role picker — type="button" mandatory ── */}
                    {mode === 'register' && (
                        <div className="mb-5">
                            <p className="text-xs font-semibold mb-2" style={{ color: RC.textMid }}>
                                Register as
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {ROLES.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => {
                                            setForm((f) => ({ ...f, role: r.value }));
                                            setFieldErrors({});
                                        }}
                                        className="p-3 rounded-xl flex flex-col items-center gap-1 text-xs font-semibold transition-all"
                                        style={
                                            form.role === r.value
                                                ? {
                                                      backgroundColor: RC.crimson,
                                                      color: '#fff',
                                                      border: `2px solid ${RC.crimsonDark}`,
                                                  }
                                                : {
                                                      backgroundColor: '#fff',
                                                      color: RC.textMid,
                                                      border: '2px solid #E0E0E0',
                                                  }
                                        }
                                    >
                                        <span className="text-xl">{r.icon}</span>
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="space-y-3">
                            {mode === 'register' && (
                                <Field label="Full Name" error={fieldErrors.name}>
                                    <RCInput
                                        value={form.name}
                                        onChange={setField('name')}
                                        placeholder="Your full name"
                                        hasError={!!fieldErrors.name}
                                    />
                                </Field>
                            )}

                            <Field label="Phone Number" error={fieldErrors.phone}>
                                <RCInput
                                    value={form.phone}
                                    onChange={setField('phone')}
                                    placeholder="10-digit mobile number"
                                    inputMode="numeric"
                                    hasError={!!fieldErrors.phone}
                                />
                            </Field>

                            <Field label="Password" error={fieldErrors.password}>
                                <RCInput
                                    type="password"
                                    value={form.password}
                                    onChange={setField('password')}
                                    placeholder="Minimum 6 characters"
                                    hasError={!!fieldErrors.password}
                                />
                            </Field>

                            {mode === 'register' &&
                                (form.role === 'HOSPITAL' || form.role === 'BLOOD_BANK') && (
                                    <>
                                        <Field
                                            label={
                                                form.role === 'HOSPITAL'
                                                    ? 'Hospital Name'
                                                    : 'Blood Bank Name'
                                            }
                                            error={fieldErrors.entityName}
                                        >
                                            <RCInput
                                                value={form.entityName}
                                                onChange={setField('entityName')}
                                                placeholder="Official registered name"
                                                hasError={!!fieldErrors.entityName}
                                            />
                                        </Field>

                                        <Field label="Address (optional)">
                                            <RCInput
                                                value={form.address}
                                                onChange={setField('address')}
                                                placeholder="Full address"
                                            />
                                        </Field>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Field label="Latitude (optional)">
                                                <RCInput
                                                    type="number"
                                                    value={form.latitude}
                                                    onChange={setField('latitude')}
                                                    placeholder="e.g. 19.0760"
                                                />
                                            </Field>
                                            <Field label="Longitude (optional)">
                                                <RCInput
                                                    type="number"
                                                    value={form.longitude}
                                                    onChange={setField('longitude')}
                                                    placeholder="e.g. 72.8777"
                                                />
                                            </Field>
                                        </div>
                                        <p className="text-xs" style={{ color: RC.textMuted }}>
                                            📍 Coordinates enable distance-based blood search
                                        </p>
                                    </>
                                )}
                        </div>

                        {/* ── Success banner ── */}
                        {success && (
                            <div
                                className="mt-4 p-3 rounded-xl text-sm font-medium"
                                style={{
                                    backgroundColor: RC.greenLight,
                                    border: `1.5px solid ${RC.greenMid}`,
                                    color: RC.greenDark,
                                }}
                            >
                                {success}
                            </div>
                        )}

                        {/* ── Global error banner (server errors / network errors) ── */}
                        {globalError && (
                            <div
                                className="mt-4 p-3 rounded-xl text-sm font-medium"
                                style={{
                                    backgroundColor: '#FDE8F0',
                                    border: `1.5px solid ${RC.crimson}`,
                                    color: RC.crimson,
                                }}
                            >
                                <p className="font-bold mb-1">
                                    ⚠️ {mode === 'login' ? 'Sign in failed' : 'Registration failed'}
                                </p>
                                {/* Multiline errors from validation field-list */}
                                {globalError.split('\n').map((line, i) => (
                                    <p key={i} className="text-xs mt-0.5">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* ── Submit button ── */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-5 py-3 rounded-xl font-black text-sm tracking-wide transition-all"
                            style={{
                                backgroundColor: loading ? '#C0C0C0' : RC.crimson,
                                color: '#fff',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.75 : 1,
                            }}
                        >
                            {loading
                                ? mode === 'login'
                                    ? 'Signing in…'
                                    : 'Creating account…'
                                : mode === 'login'
                                  ? 'SIGN IN'
                                  : 'CREATE ACCOUNT'}
                        </button>
                    </form>

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

// ── Field wrapper with inline error ──────────────────────────────────────────
function Field({ label, error, children }) {
    return (
        <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: RC.textMid }}>
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs mt-1 font-medium" style={{ color: RC.crimson }}>
                    ⚠ {error}
                </p>
            )}
        </div>
    );
}

// ── Input component ───────────────────────────────────────────────────────────
function RCInput({ hasError, ...props }) {
    const borderNormal = hasError ? RC.crimson : '#E0E0E0';
    return (
        <input
            {...props}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
                backgroundColor: '#fff',
                border: `1.5px solid ${borderNormal}`,
                color: RC.textDark,
            }}
            onFocus={(e) => (e.target.style.borderColor = RC.crimson)}
            onBlur={(e) => (e.target.style.borderColor = hasError ? RC.crimson : '#E0E0E0')}
        />
    );
}
