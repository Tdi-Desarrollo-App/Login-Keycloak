// src/Dashboard.js
import React, { useEffect, useState } from "react";

function Dashboard({ keycloak, userInfo, hasRole }) {
  // ---------- NUEVO: estado para el perfil extendido de Azure ----------
  const [msProfile, setMsProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    // Llama a tu backend que a su vez usa el broker de Keycloak → Graph
    // Endpoint sugerido en respuestas anteriores: GET /api/me/profile
    // (Si aún no existe, puedes comentar este fetch; el UI se adapta solo)
    const ctrl = new AbortController();
    fetch("/api/me/profile", {
      headers: {
        // Si guardas el token globalmente puedes incluirlo, pero si tu proxy
        // ya cuelga de /api y el backend valida Authorization, bastaría
        // "Authorization": `Bearer ${keycloak?.token}`,
      },
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setMsProfile(json))
      .catch(() => setMsProfile(null))
      .finally(() => setLoadingProfile(false));

    return () => ctrl.abort();
  }, [keycloak?.token]);

  // ---------- Config de apps por roles ----------
  const appsConfig = [
    { id: 1, name: "Dashboard", url: "https://dashboard.devcastellanos.site", roles: ["access:dashboard"] },
    { id: 2, name: "RRHH",      url: "https://rrhh.devcastellanos.site",      roles: ["access:rrhh"] },
    { id: 3, name: "ALMACEN",   url: "https://almacen.devcastellanos.site",   roles: ["access:almacen"] },
    // Ejemplo de OR de roles:
    // { id: 4, name: "Tickets", url: "...", roles: ["access:tickets", "access:rrhh"] }
  ];

  const availableApps = appsConfig.filter(app =>
    app.roles.some(role => hasRole(role))
  );

  // ---------- Helpers visuales ----------
  const Card = ({ children, style }) => (
    <div style={{ padding: 16, borderRadius: 8, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", ...style }}>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div style={{ display: "flex", gap: 8, fontSize: 14 }}>
      <div style={{ width: 140, color: "#64748b" }}>{label}</div>
      <div style={{ color: "#0f172a" }}>{value || <span style={{ color: "#94a3b8" }}>—</span>}</div>
    </div>
  );

  // Datos base de Keycloak (token/userinfo)
  const realmRoles = keycloak?.tokenParsed?.realm_access?.roles ?? [];
  const upn = userInfo?.preferred_username || msProfile?.userPrincipalName || "";

  return (
    <div>
      {/* ---------- Encabezado con Avatar + Perfil de Azure (si está disponible) ---------- */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src="/api/me/photo"               // ← backend proxy a Graph
            alt={upn || "avatar"}
            width={56}
            height={56}
            style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
            onError={(e) => { e.currentTarget.src = "/avatar-placeholder.png"; }}
          />
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {msProfile?.displayName || userInfo?.name || upn || "Usuario"}
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              {[
                msProfile?.jobTitle,            // cargo
                msProfile?.department,          // departamento
                msProfile?.officeLocation       // oficina
              ].filter(Boolean).join(" · ") || upn}
            </div>
          </div>
        </div>

        {/* rejilla con datos clave */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Card style={{ boxShadow: "none", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Correo</div>
            <div style={{ fontWeight: 600 }}>{msProfile?.mail || userInfo?.email || upn || "—"}</div>
          </Card>
          <Card style={{ boxShadow: "none", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Teléfono</div>
            <div style={{ fontWeight: 600 }}>{msProfile?.mobilePhone || (msProfile?.businessPhones?.[0]) || "—"}</div>
          </Card>
          <Card style={{ boxShadow: "none", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>Manager</div>
            <div style={{ fontWeight: 600 }}>{msProfile?.manager?.displayName || "—"}</div>
          </Card>
        </div>
      </Card>

      {/* ---------- Apps disponibles por rol ---------- */}
      <h2 style={{ marginTop: 24 }}>Aplicaciones disponibles</h2>
      {availableApps.length === 0 ? (
        <p>No tienes aplicaciones asignadas</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginTop: 12 }}>
          {availableApps.map(app => (
            <Card key={app.id}>
              <h3 style={{ marginBottom: 8 }}>{app.name}</h3>
              <div style={{ fontSize: 12, color: "#475569" }}>
                Requiere: {app.roles.join(" OR ")}
              </div>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 12, display: "inline-block", padding: "8px 12px", background: "#3b82f6", color: "#fff", borderRadius: 6, textDecoration: "none" }}
              >
                Ir a la aplicación
              </a>
            </Card>
          ))}
        </div>
      )}

      {/* ---------- Panel de “Detalles” (token + userinfo + perfil Graph) ---------- */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Identidad (Keycloak)</h3>
          <div style={{ display: "grid", gap: 6 }}>
            <InfoRow label="Username/UPN" value={upn} />
            <InfoRow label="Nombre" value={userInfo?.name || `${userInfo?.given_name ?? ""} ${userInfo?.family_name ?? ""}`} />
            <InfoRow label="Email verificado" value={String(userInfo?.email_verified ?? false)} />
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Roles (realm)</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {realmRoles.length
              ? realmRoles.map((r) => (
                  <span key={r} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999, background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                    {r}
                  </span>
                ))
              : <span style={{ color: "#94a3b8" }}>—</span>}
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Perfil (Microsoft Graph)</h3>
          {loadingProfile ? (
            <div style={{ fontSize: 13, color: "#64748b" }}>Cargando perfil…</div>
          ) : msProfile ? (
            <pre style={{ background: "#f8fafc", padding: 12, borderRadius: 6, maxHeight: 260, overflow: "auto", margin: 0 }}>
              {JSON.stringify(msProfile, null, 2)}
            </pre>
          ) : (
            <div style={{ fontSize: 13, color: "#64748b" }}>No disponible (verifica /api/me/profile)</div>
          )}
        </Card>
      </div>

      {/* ---------- JSON crudo de userInfo + roles (lo que ya tenías) ---------- */}
      <div style={{ marginTop: 24 }}>
        <h2>Detalles del usuario (raw)</h2>
        <pre style={{ background: "#e2e8f0", padding: 16, borderRadius: 8 }}>
          {JSON.stringify({ ...userInfo, realm_roles: realmRoles }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default Dashboard;
