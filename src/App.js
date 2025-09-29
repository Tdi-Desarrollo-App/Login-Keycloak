// src/App.js
import React, { useEffect, useState } from "react";
import { keycloak, initKeycloak, logout, hasRole } from "./keycloak";
import Dashboard from "./Dashboard";

function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    initKeycloak(() => {
      setAuthenticated(true);
      setReady(true);
      setUserInfo(keycloak.userInfo);
    });
  }, []);

  if (!ready) return <div>Cargando autenticación...</div>;
  if (!authenticated) return <div>No autenticado</div>;

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Portal de Aplicaciones</h1>
        <div>
          <span style={{ marginRight: 12 }}>
            {userInfo?.preferred_username || keycloak.tokenParsed?.preferred_username}
          </span>
          <button onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main style={{ marginTop: 20 }}>
        <Dashboard keycloak={keycloak} userInfo={userInfo} hasRole={hasRole} />
      </main>
    </div>
  );
}

export default App;
