const BASE = process.env.REACT_APP_API_URL || "/api";

export const getToken = () => localStorage.getItem("token");

let isRefreshing = false;
let failQueue = [];

const processQueue = (error, token = null) => {
    failQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failQueue = [];
};

export const apiFetch = async (path, options = {}, retry = true) => {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
            ...(options.headers || {}),
        },
    });

    // Auto-refresh on 401
    if (res.status === 401 && retry) {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) { handleAuthExpired(); return; }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failQueue.push({ resolve, reject });
            }).then(token => {
                options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
                return apiFetch(path, options, false);
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
            options.headers = { ...options.headers, Authorization: `Bearer ${data.token}` };
            return apiFetch(path, options, false);
        } catch {
            processQueue(new Error("Session expired"));
            handleAuthExpired();
        } finally {
            isRefreshing = false;
        }
        return;
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `Request failed (${res.status})`);
    }

    // Handle 204 No Content
    if (res.status === 204) return null;
    return res.json();
};

function handleAuthExpired() {
    localStorage.clear();
    window.location.href = "/login";
}
