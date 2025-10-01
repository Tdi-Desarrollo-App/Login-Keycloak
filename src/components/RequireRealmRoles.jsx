// src/components/RequireRealmRoles.jsx
import React from "react";

export default function RequireRealmRoles({ keycloak, any = [], children, fallback = null }) {
  const roles = keycloak?.tokenParsed?.realm_access?.roles || [];
  const can = any.some(r => roles.includes(r));
  if (!can) return fallback ?? <div style={{ padding: 16 }}>No tienes permisos para ver esta sección.</div>;
  return children;
}
