// src/App.js
import React, { useEffect, useState } from "react";
import { keycloak, initKeycloak, logout, hasRole } from "./keycloak";
import Dashboard from "./Dashboard";
import RHMaster from "./RHMaster";
import Almacen from "./Almacen";
import Tickets from "./Tickets";
import DevView from "./DevView";
import RequireRealmRoles from "./components/RequireRealmRoles";

function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  useEffect(() => {
    initKeycloak(() => {
      setAuthenticated(true);
      setReady(true);
      setUserInfo(keycloak.userInfo);
    });
  }, []);

  if (!ready) return <div>Cargando autenticación...</div>;
  if (!authenticated) return <div>No autenticado</div>;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", roles: ["access:dashboard"] },
    { id: "rh-master", label: "RRHH",      roles: ["access:rrhh"] },
    { id: "almacen",   label: "Almacén",   roles: ["access:almacen"] },
    { id: "tickets",   label: "Tickets",   roles: ["access:tickets"] },
    { id: "dev",       label: "Desarrollo",roles: ["access:dev"] },
  ];
  const availableMenu = menuItems.filter(item => item.roles.some(r => hasRole(r)));

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard keycloak={keycloak} userInfo={userInfo} hasRole={hasRole} />;
      case "rh-master":
        return (
          <RequireRealmRoles keycloak={keycloak} any={["access:rrhh"]}>
            <RHMaster />
          </RequireRealmRoles>
        );
      case "almacen":
        return (
          <RequireRealmRoles keycloak={keycloak} any={["access:almacen"]}>
            <Almacen keycloak={keycloak} hasRole={hasRole} />
          </RequireRealmRoles>
        );
      case "tickets":
        return (
          <RequireRealmRoles keycloak={keycloak} any={["access:tickets"]}>
            <Tickets />
          </RequireRealmRoles>
        );
      case "dev":
        return (
          <RequireRealmRoles keycloak={keycloak} any={["access:dev"]}>
            <DevView />
          </RequireRealmRoles>
        );
      default:
        return <Dashboard keycloak={keycloak} userInfo={userInfo} hasRole={hasRole} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      <aside style={{ width: 220, background: "#1e293b", color: "#fff", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <h2>Portal de Apps</h2>
          <p style={{ fontSize: 12 }}>{userInfo?.preferred_username}</p>
          <nav style={{ marginTop: 20 }}>
            {availableMenu.map(item => (
              <div
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  padding: "10px 8px",
                  margin: "5px 0",
                  cursor: "pointer",
                  background: activeView === item.id ? "#334155" : "transparent",
                  borderRadius: 4
                }}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <img
          src="/api/me/photo"
          alt={userInfo?.preferred_username || "avatar"}
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
          onError={(e) => { e.currentTarget.src = "/avatar-placeholder.png"; }}
        />

        <button onClick={logout} style={{ padding: 10, background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Cerrar sesión
        </button>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", padding: 20, background: "#f1f5f9" }}>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
