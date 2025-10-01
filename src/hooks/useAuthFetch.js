// src/hooks/useAuthFetch.js
import { useCallback } from "react";

export default function useAuthFetch(keycloak) {
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (keycloak?.token) {
      headers.set("Authorization", `Bearer ${keycloak.token}`);
    }
    const resp = await fetch(url, { ...options, headers });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json().catch(() => ({}));
  }, [keycloak]);

  return authFetch;
}
