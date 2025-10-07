// src/App.js
import React, { useEffect, useState } from "react";
import { keycloak, initKeycloak, logout, hasRole } from "./keycloak";
import Dashboard from "./Dashboard";
import RHMaster from "./RHMaster";
import Almacen from "./Almacen";
import Tickets from "./Tickets";
import DevView from "./DevView";
import RequireRealmRoles from "./components/RequireRealmRoles";
import {
  LayoutDashboard,
  Users2,
  Boxes,
  Ticket,
  Code2,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "./Dashboard.css";

function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  const [isDark, setIsDark] = useState(false);
  const [sidebarPhotoUrl, setSidebarPhotoUrl] = useState(null);

  // colapso persistente
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("imt_sidebar_collapsed") === "1"; } catch { return false; }
  });

  async function authFetch(url, opts = {}) {
    await keycloak.updateToken(30).catch(() => keycloak.login());
    const headers = { ...(opts.headers || {}), Authorization: `Bearer ${keycloak?.token}` };
    return fetch(url, { ...opts, headers });
  }

  useEffect(() => {
    initKeycloak(() => {
      setAuthenticated(true);
      setReady(true);
      setUserInfo(keycloak.userInfo);
    });
  }, []);

  useEffect(() => {
    setIsDark(document.body.classList.contains("dark-mode"));
  }, []);

  useEffect(() => {
    let cancelled = false, objectUrl;
    if (!authenticated) return;
    (async () => {
      try {
        const r = await authFetch("/api/me/photo");
        if (!r.ok) throw new Error("no-photo");
        const blob = await r.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setSidebarPhotoUrl(objectUrl);
      } catch {
        if (!cancelled) setSidebarPhotoUrl("/avatar-placeholder.png");
      }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, keycloak]);

  if (!ready) return <div style={{ fontFamily: "Poppins, sans-serif" }}>Cargando autenticación...</div>;
  if (!authenticated) return <div style={{ fontFamily: "Poppins, sans-serif" }}>No autenticado</div>;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", roles: ["access:dashboard"], icon: <LayoutDashboard size={18} /> },
    { id: "rh-master", label: "RRHH", roles: ["access:rrhh"], icon: <Users2 size={18} /> },
    { id: "almacen", label: "Almacén", roles: ["access:almacen"], icon: <Boxes size={18} /> },
    { id: "tickets", label: "Tickets", roles: ["access:tickets"], icon: <Ticket size={18} /> },
    { id: "dev", label: "Desarrollo", roles: ["access:dev"], icon: <Code2 size={18} /> },
  ];
  const availableMenu = menuItems.filter((item) => item.roles.some((r) => hasRole(r)));

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <Dashboard keycloak={keycloak} userInfo={userInfo} hasRole={hasRole} />;
      case "rh-master": return <RequireRealmRoles keycloak={keycloak} any={["access:rrhh"]}><RHMaster /></RequireRealmRoles>;
      case "almacen": return <RequireRealmRoles keycloak={keycloak} any={["access:almacen"]}><Almacen keycloak={keycloak} hasRole={hasRole} /></RequireRealmRoles>;
      case "tickets": return <RequireRealmRoles keycloak={keycloak} any={["access:tickets"]}><Tickets /></RequireRealmRoles>;
      case "dev": return <RequireRealmRoles keycloak={keycloak} any={["access:dev"]}><DevView /></RequireRealmRoles>;
      default: return <Dashboard keycloak={keycloak} userInfo={userInfo} hasRole={hasRole} />;
    }
  };

  const toggleTheme = () => {
    document.body.classList.toggle("dark-mode");
    setIsDark(document.body.classList.contains("dark-mode"));
  };

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("imt_sidebar_collapsed", next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const logoSrc = isDark ? "/imt-logo-dark.png" : "/imt-logo.png";
  const SIDEBAR_W = collapsed ? 76 : 260;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Poppins, sans-serif" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: SIDEBAR_W,
          transition: "width 180ms ease, padding 180ms ease",
          background: "var(--panel)",
          color: "var(--primary)",
          padding: collapsed ? 12 : 20,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div>
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: collapsed ? 8 : 10,
              paddingBottom: 12,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <img
              src={logoSrc}
              alt="IMT Logo"
              style={{
                height: collapsed ? 28 : 48,
                objectFit: "contain",
                transition: "height 180ms ease",
              }}
            />
          </div>

          {/* NAV */}
          <nav style={{ marginTop: 16 }}>
            {availableMenu.map((item) => {
              const active = activeView === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: "10px 12px",
                    margin: "6px 0",
                    cursor: "pointer",
                    background: active ? "var(--primary-20)" : "transparent",
                    borderRadius: 10,
                    color: "var(--primary)",
                    fontWeight: active ? 600 : 500,
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <div style={{ display: "grid", placeItems: "center", width: 24 }}>
                    {item.icon}
                  </div>
                  {!collapsed && <span>{item.label}</span>}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer siempre visible pero adaptado */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {/* Botón Tema */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title="Cambiar tema"
            style={{
              width: collapsed ? 34 : "auto",
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: collapsed ? 0 : 6,
              padding: collapsed ? 0 : "0 8px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--primary)",
              cursor: "pointer",
            }}
          >
            <Moon size={16} />
            {!collapsed && <span style={{ fontSize: 12, fontWeight: 600 }}>Tema</span>}
          </button>

          {/* Botón Cerrar sesión */}
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            style={{
              width: collapsed ? 34 : "auto",
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: collapsed ? 0 : 6,
              padding: collapsed ? 0 : "0 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--primary)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease, color 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--primary-10)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={16} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Botón flotante fuera del sidebar */}
      <button
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        title={collapsed ? "Expandir" : "Colapsar"}
        style={{
          position: "fixed",
          left: SIDEBAR_W + 8,
          top: 16,
          zIndex: 50,
          width: 30,
          height: 30,
          display: "grid",
          placeItems: "center",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "var(--panel)",
          color: "var(--primary)",
          boxShadow: "var(--shadow)",
          cursor: "pointer",
          transition: "left 180ms ease",
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Contenido principal */}
      <main style={{ flex: 1, overflowY: "auto", padding: 0, background: "var(--app-bg)" }}>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
