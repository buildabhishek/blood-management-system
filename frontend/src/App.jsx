import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboard     from './dashboards/AdminDashboard';
import BloodBankDashboard from './dashboards/BloodBankDashboard';
import HospitalDashboard  from './dashboards/HospitalDashboard';
import RiderDashboard     from './dashboards/RiderDashboard';
import { listenToMessages, requestToken } from './firebase';
import Landing from './pages/Landing';
import Login   from './pages/Login';

const BASE = process.env.REACT_APP_API_URL || '/api';

export default function App() {
  const [auth,    setAuth]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');
    if (token && role) setAuth({ token, role });
    if (token) {
      requestToken().then(fcm => {
        if (fcm) fetch(`${BASE}/auth/fcm-token`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fcmToken: fcm }),
        }).catch(() => {});
      }).catch(() => {});
    }
    listenToMessages();
    setLoading(false);
  }, []);

  const handleLogin  = data => setAuth(data);
  const handleLogout = async () => {
    if (!window.confirm('Log out?')) return;
    const rt = localStorage.getItem('refreshToken');
    if (rt) fetch(`${BASE}/auth/logout`, { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) }).catch(() => {});
    localStorage.clear();
    setAuth(null);
  };

  // BUG FIX: was return null — caused a blank white flash on every page load
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FFF0F3', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #E0E0E0',
        borderTop: '4px solid #C62828', borderRadius: '50%',
         }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#C62828', fontWeight: 700, fontSize: '13px' }}>Loading BloodMS…</p>
    </div>
  );

  const dashboard = () => {
    if (!auth) return <Navigate to="/login" replace />;
    const p = { onLogout: handleLogout };
    switch (auth.role) {
      case 'HOSPITAL':   return <HospitalDashboard  {...p} />;
      case 'BLOOD_BANK': return <BloodBankDashboard {...p} />;
      case 'RIDER':      return <RiderDashboard     {...p} />;
      case 'ADMIN':      return <AdminDashboard     {...p} />;
      default: localStorage.clear(); return <Navigate to="/login" replace />;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={auth ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login"     element={auth ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
        <Route path="/dashboard" element={dashboard()} />
        <Route path="*"          element={<Navigate to={auth ? '/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
