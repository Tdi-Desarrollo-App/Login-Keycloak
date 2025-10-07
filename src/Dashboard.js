import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users2,
  Boxes,
  Ticket,
  Code2,
  Pill,
  FlaskConical,
  Droplet,
  Activity,
} from "lucide-react";
import "./Dashboard.css"; // Poppins + variables de color

function Dashboard({ keycloak, userInfo, hasRole }) {
  // ---------- Helper: fetch autenticado con Keycloak ----------
  async function authFetch(url, opts = {}) {
    // refresca token si faltan <30s
    await keycloak.updateToken(30).catch(() => keycloak.login());
    const headers = {
      ...(opts.headers || {}),
      Authorization: `Bearer ${keycloak?.token}`,
    };
    return fetch(url, { ...opts, headers });
  }

  // ---------- Estado perfil Graph + foto ----------
  const [msProfile, setMsProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);

  // Perfil (Graph) usando token del backend (client credentials)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await authFetch("/api/me/profile");
        const json = r.ok ? await r.json() : null;
        if (!cancelled) setMsProfile(json);
      } catch {
        if (!cancelled) setMsProfile(null);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keycloak]); // depende de la instancia (token se maneja dentro de authFetch)

  // Foto (Graph) → blob (no usar <img src="/api/me/photo"> directo porque no manda Authorization)
  useEffect(() => {
    let cancelled = false;
    let objectUrl;
    (async () => {
      try {
        const r = await authFetch("/api/me/photo");
        if (!r.ok) throw new Error("no photo");
        const blob = await r.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setPhotoUrl(objectUrl);
      } catch {
        if (!cancelled) setPhotoUrl("/avatar-placeholder.png");
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keycloak]);

  // ---------- Datos base de Keycloak ----------
  const realmRoles = keycloak?.tokenParsed?.realm_access?.roles ?? [];
  const upn =
    userInfo?.preferred_username ||
    msProfile?.userPrincipalName ||
    userInfo?.email ||
    "";

  // ---------- Config de apps (roles + iconos) ----------
  const appsConfig = [
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Panel principal con accesos y estado general de las aplicaciones.",
      url: "https://dashboard.devcastellanos.site",
      roles: ["access:dashboard"],
      icon: <LayoutDashboard className="icon-lg" />,
    },
    {
      id: "rrhh",
      name: "RRHH",
      description: "Gestión de personal, expedientes y procesos de RH.",
      url: "https://rrhh.devcastellanos.site",
      roles: ["access:rrhh"],
      icon: <Users2 className="icon-lg" />,
    },
    {
      id: "almacen",
      name: "Almacén",
      description: "Control de existencias, entradas y salidas de inventario.",
      url: "https://almacen.devcastellanos.site",
      roles: ["access:almacen"],
      icon: <Boxes className="icon-lg" />,
    },
    {
      id: "tickets",
      name: "Tickets",
      description: "Mesa de ayuda y seguimiento de incidencias.",
      url: "https://tickets.devcastellanos.site",
      roles: ["access:tickets"],
      icon: <Ticket className="icon-lg" />,
    },
    {
      id: "dev",
      name: "Desarrollo",
      description: "Entorno y utilidades para el equipo de desarrollo.",
      url: "https://dev.devcastellanos.site",
      roles: ["access:dev"],
      icon: <Code2 className="icon-lg" />,
    },
    // Apps futuras (médicas)
    {
      id: "farmacia",
      name: "App de Farmacia",
      description: "Gestión de inventario y dispensación de medicamentos.",
      url: "#",
      roles: ["access:farmacia"],
      icon: <Pill className="icon-lg" />,
    },
    {
      id: "laboratorio",
      name: "App de Laboratorio",
      description: "Administración de muestras y resultados de análisis.",
      url: "#",
      roles: ["access:laboratorio"],
      icon: <FlaskConical className="icon-lg" />,
    },
    {
      id: "banco-sangre",
      name: "App Banco de Sangre",
      description: "Control de donaciones y stock de unidades sanguíneas.",
      url: "#",
      roles: ["access:banco-sangre"],
      icon: <Droplet className="icon-lg" />,
    },
    {
      id: "monitoreo",
      name: "App de Monitoreo",
      description: "Visualización de signos vitales en tiempo real.",
      url: "#",
      roles: ["access:monitoreo"],
      icon: <Activity className="icon-lg" />,
    },
  ];

  const availableApps = appsConfig.filter((app) =>
    app.roles.some((role) => hasRole(role))
  );

  // ---------- Helpers visuales ----------
  const Card = ({ children, style }) => (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        background: "var(--panel)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        ...style,
      }}
    >
      {children}
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div style={{ display: "flex", gap: 8, fontSize: 14 }}>
      <div style={{ width: 140, color: "var(--muted)" }}>{label}</div>
      <div style={{ color: "var(--text)" }}>
        {value || <span style={{ color: "#94a3b8" }}>—</span>}
      </div>
    </div>
  );

  return (
    <div className="content">
      {/* ---------- Encabezado con Avatar + Perfil ---------- */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src={photoUrl || "/avatar-placeholder.png"}
            alt={upn || "avatar"}
            width={56}
            height={56}
            style={{ borderRadius: "50%", objectFit: "cover", display: "block" }}
          />
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>
              {msProfile?.displayName || userInfo?.name || upn || "Usuario"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {[
                msProfile?.jobTitle,
                msProfile?.department,
                msProfile?.officeLocation,
              ]
                .filter(Boolean)
                .join(" · ") || upn}
            </div>
          </div>
        </div>

        {/* rejilla con datos clave */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          <Card style={{ boxShadow: "none" }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Correo</div>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>
              {msProfile?.mail || userInfo?.email || upn || "—"}
            </div>
          </Card>
          <Card style={{ boxShadow: "none" }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Teléfono</div>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>
              {msProfile?.mobilePhone || msProfile?.businessPhones?.[0] || "—"}
            </div>
          </Card>
          <Card style={{ boxShadow: "none" }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Manager</div>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>
              {msProfile?.manager?.displayName || "—"}
            </div>
          </Card>
        </div>
      </Card>

      {/* ---------- Título + Tarjetas de Apps (con ícono/logo) ---------- */}
      <h2 className="title" style={{ marginTop: 24 }}>
        Aplicaciones disponibles
      </h2>

      {availableApps.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No tienes aplicaciones asignadas</p>
      ) : (
        <div
          className="cards"
          style={{ marginTop: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {availableApps.map((app) => (
            <Card key={app.id}>
              <div className="card-icon">{app.icon}</div>
              <h3 className="card-title" style={{ color: "var(--text)" }}>
                {app.name}
              </h3>
              <p className="card-desc">{app.description}</p>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Abrir
              </a>
            </Card>
          ))}
        </div>
      )}

      {/* ---------- Panel de Detalles ---------- */}
      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        <Card>
          <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Identidad (Keycloak)</h3>
          <div style={{ display: "grid", gap: 6 }}>
            <InfoRow label="Username/UPN" value={upn} />
            <InfoRow
              label="Nombre"
              value={
                userInfo?.name ||
                `${userInfo?.given_name ?? ""} ${userInfo?.family_name ?? ""}`
              }
            />
            <InfoRow
              label="Email verificado"
              value={String(userInfo?.email_verified ?? false)}
            />
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Roles (realm)</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {realmRoles.length ? (
              realmRoles.map((r) => (
                <span
                  key={r}
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "var(--primary-10)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {r}
                </span>
              ))
            ) : (
              <span style={{ color: "#94a3b8" }}>—</span>
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0, color: "var(--primary)" }}>Perfil (Microsoft Graph)</h3>
          {loadingProfile ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Cargando perfil…</div>
          ) : msProfile ? (
            <pre
              style={{
                background: "var(--code-bg)",
                color: "var(--text)",
                padding: 12,
                borderRadius: 6,
                maxHeight: 260,
                overflow: "auto",
                margin: 0,
                border: "1px solid var(--border)",
              }}
            >
              {JSON.stringify(msProfile, null, 2)}
            </pre>
          ) : (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              No disponible (verifica /api/me/profile)
            </div>
          )}
        </Card>
      </div>

      {/* ---------- JSON crudo ---------- */}
      <div style={{ marginTop: 24 }}>
        <h2 className="title" style={{ fontSize: 20 }}>
          Detalles del usuario (raw)
        </h2>
        <pre
          style={{
            background: "var(--code-bg)",
            color: "var(--text)",
            padding: 16,
            borderRadius: 8,
            border: "1px solid var(--border)",
            maxHeight: 320,
            overflow: "auto",
          }}
        >
          {JSON.stringify({ ...userInfo, realm_roles: realmRoles }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default Dashboard;
