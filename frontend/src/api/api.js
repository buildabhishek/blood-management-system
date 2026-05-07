const BASE = process.env.REACT_APP_API_URL || '/api';

export const getToken = () => localStorage.getItem('token');

let refreshing = false;
let queue = [];
const flush = (err, tok) => { queue.forEach(p => err ? p.reject(err) : p.resolve(tok)); queue = []; };

export const apiFetch = async (path, opts = {}, retry = true) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  // Auto-refresh on 401 (but never on auth endpoints)
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) { expireSession(); throw new Error('Session expired. Please log in again.'); }
    if (refreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject }))
        .then(newTok => apiFetch(path, { ...opts, headers: { ...headers, Authorization: `Bearer ${newTok}` } }, false));
    }
    refreshing = true;
    try {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!r.ok) throw new Error('Refresh failed');
      const d = await r.json();
      localStorage.setItem('token', d.token);
      localStorage.setItem('refreshToken', d.refreshToken);
      flush(null, d.token);
      return apiFetch(path, { ...opts, headers: { ...headers, Authorization: `Bearer ${d.token}` } }, false);
    } catch {
      flush(new Error('Session expired'));
      expireSession(); throw new Error('Session expired. Please log in again.');
    } finally { refreshing = false; }
  }

  if (!res.ok) {
    let err = {};
    try { err = await res.json(); } catch { /**/ }
    if (err.fields) {
      const lines = Object.entries(err.fields).map(([f, m]) => `${cap(f)}: ${m}`).join('\n');
      throw new Error(lines || err.error || 'Validation failed');
    }
    throw new Error(err.error || err.message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;
  return res.json();
};

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function expireSession() { localStorage.clear(); window.location.href = '/login'; }
