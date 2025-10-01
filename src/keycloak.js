// src/keycloak.js
import Keycloak from "keycloak-js";

// Reusa la instancia entre recargas (HMR) y navegación
const kcInstance = (() => {
  if (typeof window !== "undefined" && window.__kc_instance) {
    return window.__kc_instance;
  }
  const inst = new Keycloak({
    url: "https://auth.devcastellanos.site/",
    realm: "Login",
    clientId: "react-app",
  });
  if (typeof window !== "undefined") {
    window.__kc_instance = inst;
  }
  return inst;
})();

let initPromise =
  (typeof window !== "undefined" && window.__kc_init_promise) || null;
let initDone =
  (typeof window !== "undefined" && window.__kc_init_done) || false;

// Refresco de token (una sola vez)
let refreshTimerStarted =
  (typeof window !== "undefined" && window.__kc_refresh_started) || false;

const startRefreshTimer = () => {
  if (refreshTimerStarted) return;
  refreshTimerStarted = true;
  if (typeof window !== "undefined") window.__kc_refresh_started = true;

  setInterval(() => {
    if (kcInstance.authenticated) {
      kcInstance
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed) console.log("[KC] Token refrescado");
        })
        .catch(() => console.warn("[KC] Error refrescando token"));
    }
  }, 60 * 1000);
};

export const initKeycloak = (onAuthenticatedCallback) => {
  // Si ya terminamos la init, invoca callback y regresa promesa resuelta
  if (initDone) {
    onAuthenticatedCallback && onAuthenticatedCallback();
    return Promise.resolve(true);
  }
  // Si hay una init en progreso, cuélgate de esa promesa
  if (initPromise) {
    return initPromise.then(() => {
      onAuthenticatedCallback && onAuthenticatedCallback();
      return true;
    });
  }

  // Primera (y única) inicialización real
  initPromise = kcInstance
    .init({
      onLoad: "login-required",
      pkceMethod: "S256",
      checkLoginIframe: false,
    })
    .then(async (authenticated) => {
      if (!authenticated) {
        console.warn("[KC] No autenticado");
        return false;
      }
      try {
        const userInfo = await kcInstance.loadUserInfo();
        kcInstance.userInfo = userInfo;
      } catch (e) {
        console.warn("[KC] No se pudo cargar userInfo:", e);
      }
      startRefreshTimer();
      initDone = true;
      if (typeof window !== "undefined") {
        window.__kc_init_done = true;
        window.__kc_init_promise = initPromise;
      }
      onAuthenticatedCallback && onAuthenticatedCallback();
      return true;
    })
    .catch((err) => {
      console.error("[KC] Error inicializando Keycloak:", err);
      throw err;
    });

  if (typeof window !== "undefined") {
    window.__kc_init_promise = initPromise;
  }
  return initPromise;
};

export const keycloak = kcInstance;

export const logout = () => {
  kcInstance.logout({
    redirectUri: "http://localhost:3000/",
  });
};

// ✅ Lectura correcta de realm roles
export const hasRole = (role) => {
  const roles = keycloak?.tokenParsed?.realm_access?.roles || [];
  return roles.includes(role);
};
