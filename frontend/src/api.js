const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

export async function getJson(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export async function postFormData(url, formData, token = null) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    credentials: "include",
    body: formData,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export async function getJsonWithAuth(url, token, options = {}) {
  return getJson(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

export { API_BASE };
