// adminApi.js
const API_URL = import.meta.env.VITE_API_URL;

export const getToken = () => localStorage.getItem("access_token");

export async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Jika token expired atau unauthorized
  if (res.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    // JANGAN gunakan window.location.href di sini agar tidak loop
    throw new Error("Unauthorized");
  }

  if (res.status === 403) {
    throw new Error("Forbidden: Anda tidak memiliki akses admin.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function buildParams(obj) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) params.append(k, String(v));
  });
  return params.toString();
}