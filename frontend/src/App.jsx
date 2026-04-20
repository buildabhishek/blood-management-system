import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboard from './dashboards/AdminDashboard';
import BloodBankDashboard from './dashboards/BloodBankDashboard';
import HospitalDashboard from './dashboards/HospitalDashboard';
import RiderDashboard from './dashboards/RiderDashboard';
import { listenToMessages, requestToken } from './firebase';
import Landing from './pages/Landing';
import Login from './pages/Login';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export default function App() {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (token && role) setAuth({ token, role });

        // 🔔 Firebase setup — only when user is logged in
        if (token) {
            requestToken().then((fcmToken) => {
                if (fcmToken) {
                    fetch(`${API_BASE}/auth/fcm-token`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ fcmToken }),
                    }).catch(() => {});
                }
            }).catch(() => {});
        }

        listenToMessages();

        setLoading(false);
    }, []);

    // No beforeunload nag — auth state is persisted in localStorage,
    // so the user can safely close/refresh and resume their session.

    const handleLogout = async () => {
        if (!window.confirm('Log out?')) return;
        const rt = localStorage.getItem('refreshToken');
        if (rt) {
            fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: rt }),
            }).catch(() => {});
        }
        localStorage.clear();
        setAuth(null);
    };

    if (loading) return null;

    const handleLogin = (authData) => setAuth(authData);

    const getDashboard = () => {
        if (!auth) return <Navigate to="/login" replace />;
        const props = { onLogout: handleLogout };
        switch (auth.role) {
            case 'HOSPITAL':
                return <HospitalDashboard {...props} />;
            case 'BLOOD_BANK':
                return <BloodBankDashboard {...props} />;
            case 'RIDER':
                return <RiderDashboard {...props} />;
            case 'ADMIN':
                return <AdminDashboard {...props} />;
            default:
                localStorage.clear();
                setAuth(null);
                return <Navigate to="/login" replace />;
        }
    };

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/"
                    element={auth ? <Navigate to="/dashboard" replace /> : <Landing />}
                />
                <Route
                    path="/login"
                    element={
                        auth ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Login onLogin={handleLogin} />
                        )
                    }
                />

                {/* Protected dashboard route */}
                <Route path="/dashboard" element={getDashboard()} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to={auth ? '/dashboard' : '/'} replace />} />
            </Routes>
        </BrowserRouter>
    );
}
