export function buildParams(obj) {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) params.append(k, String(v));
  });
  return params.toString();
}

const API_URL = import.meta.env.VITE_API_URL;
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken =
      localStorage.getItem("refresh_token");

    if (!refreshToken) {
      logout();
      throw new Error("No refresh token");
    }

    const response = await fetch(
      `${API_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      logout();
      throw new Error("Refresh failed");
    }

    const data = await response.json();

    localStorage.setItem(
      "access_token",
      data.access_token
    );

    return data.access_token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch(
  url,
  {
    auth = false,
    headers = {},
    body,
    ...options
  } = {}
) {
  const finalHeaders = {
    ...headers,
  };

  if (!(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  let accessToken =
    localStorage.getItem("access_token");

  // cuma refresh kalau auth wajib
  if (auth === "required" && !accessToken) {
    accessToken =
      await refreshAccessToken();
  }

  // kalau ada token, kirim
  if (
    (auth === "required" || auth === "optional") &&
    accessToken
  ) {
    finalHeaders.Authorization =
      `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers: finalHeaders,
    body,
  });

  // retry cuma buat auth wajib
  if (
    auth === "required" &&
    response.status === 401
  ) {
    const newAccessToken =
      await refreshAccessToken();

    finalHeaders.Authorization =
      `Bearer ${newAccessToken}`;

    response = await fetch(url, {
      ...options,
      headers: finalHeaders,
      body,
    });
  }

  return response;
}

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  window.location.href = "/auth";
}