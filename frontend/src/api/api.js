const BASE = process.env.REACT_APP_API_URL || "/api";

export const getToken = () => localStorage.getItem("token");

let isRefreshing = false;
let failQueue = [];

const processQueue = (error, token = null) => {
    failQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failQueue = [];
};

export const apiFetch = async (path, options = {}, retry = true) => {
    const token = getToken();

    // Only attach Authorization header when a real token exists
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });

    // ── 401 handling ──────────────────────────────────────────────────────────
    // IMPORTANT: Never treat 401 from auth endpoints as session expiry.
    // /api/auth/login returns 401 for wrong credentials — that is a normal error,
    // not an expired session, so we must NOT redirect to /login from here.
    const isAuthEndpoint = path.startsWith("/auth/");
    if (res.status === 401 && retry && !isAuthEndpoint) {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) { handleAuthExpired(); return; }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failQueue.push({ resolve, reject });
            }).then(newToken => {
                const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
                return apiFetch(path, { ...options, headers: retryHeaders }, false);
            });
        }

        isRefreshing = true;
        try {
            const r = await fetch(`${BASE}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
            if (!r.ok) throw new Error("Refresh failed");
            const data = await r.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            processQueue(null, data.token);
            const retryHeaders = { ...headers, Authorization: `Bearer ${data.token}` };
            return apiFetch(path, { ...options, headers: retryHeaders }, false);
        } catch {
            processQueue(new Error("Session expired"));
            handleAuthExpired();
            return;
        } finally {
            isRefreshing = false;
        }
    }

    // ── Error response handling ───────────────────────────────────────────────
    if (!res.ok) {
        let err = {};
        try { err = await res.json(); } catch { /* non-JSON error body */ }

        // Backend validation errors look like:
        // { "error": "Validation failed", "fields": { "name": "...", "phone": "..." } }
        // Flatten field errors into a readable message
        if (err.fields && typeof err.fields === "object") {
            const fieldMessages = Object.entries(err.fields)
                .map(([field, msg]) => `${capitalise(field)}: ${msg}`)
                .join("\n");
            throw new Error(fieldMessages || err.error || "Validation failed");
        }

        throw new Error(
            err.error || err.message || `Request failed (${res.status})`
        );
    }

    if (res.status === 204) return null;
    return res.json();
};

function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function handleAuthExpired() {
    localStorage.clear();
    window.location.href = "/login";
}
