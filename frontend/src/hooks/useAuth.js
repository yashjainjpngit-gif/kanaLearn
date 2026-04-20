import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "auth-session";

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(
    text.startsWith("<!DOCTYPE") || text.startsWith("<html")
      ? "Auth endpoint returned HTML instead of JSON."
      : text || "Unexpected response from server"
  );
}

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export default function useAuth() {
  const [auth, setAuth] = useState(getStoredAuth);

  function saveAuth(data) {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setAuth(data);
  }

  // Handle magic link callback — ?auth_token=xxx in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("auth_token");
    if (!token) return;

    // Clean the token out of the URL immediately
    params.delete("auth_token");
    const newSearch = params.toString();
    window.history.replaceState(
      {},
      "",
      newSearch ? `?${newSearch}` : window.location.pathname
    );

    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(parseApiResponse)
      .then((data) => {
        if (data.sessionToken) {
          saveAuth(data);
        }
      })
      .catch(() => {});
  }, []);

  const logout = useCallback(async () => {
    if (auth?.sessionToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.sessionToken}` },
      }).catch(() => {});
    }
    saveAuth(null);
  }, [auth]);

  return { auth, saveAuth, logout };
}
