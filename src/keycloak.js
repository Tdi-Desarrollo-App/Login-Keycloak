// src/keycloak.js
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "https://auth.devcastellanos.site/",   // URL de tu Keycloak
  realm: "Login",                             // Tu Realm
  clientId: "react-app",                      // Cliente que creaste en Keycloak
});

const initKeycloak = (onAuthenticatedCallback) => {
  keycloak
    .init({
      onLoad: "login-required",   // fuerza login al entrar
      pkceMethod: "S256",         // recomendado para SPAs
      checkLoginIframe: false,    // evita iframes en dev
    })
    .then((authenticated) => {
      if (authenticated) {
        // Carga info del usuario
        keycloak.loadUserInfo().then((userInfo) => {
          keycloak.userInfo = userInfo; // guarda info de usuario
          onAuthenticatedCallback && onAuthenticatedCallback();
        });
      } else {
        console.warn("No autenticado");
      }
    })
    .catch((err) => {
      console.error("Error inicializando Keycloak:", err);
    });

  // Refrescar token cada minuto
  setInterval(() => {
    if (keycloak.authenticated) {
      keycloak
        .updateToken(70) // refresca si quedan < 70 seg
        .then((refreshed) => {
          if (refreshed) console.log("Token refrescado");
        })
        .catch(() => console.warn("Error refrescando token"));
    }
  }, 60 * 1000);
};

// Función para cerrar sesión
const logout = () => {
  keycloak.logout({
    redirectUri: "https://login.devcastellanos.site/", // donde quieres que regrese el usuario
  });
};

// Función para verificar roles
const hasRole = (role) => {
  const realmRoles = keycloak.realmAccess?.roles || [];
  const clientRoles = Object.values(keycloak.resourceAccess || {}).reduce(
    (acc, cur) => acc.concat(cur.roles || []),
    []
  );
  return realmRoles.includes(role) || clientRoles.includes(role);
};

export { keycloak, initKeycloak, logout, hasRole };
