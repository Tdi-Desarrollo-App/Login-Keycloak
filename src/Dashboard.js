import React from "react";

const Dashboard = ({ keycloak, userInfo }) => {
  // roles: realm roles
  const realmRoles = keycloak?.realmAccess?.roles || [];

  // client roles (ej: roles asignadas en el client 'react-app')
  const clientRoles = Object.values(keycloak?.resourceAccess || {}).reduce(
    (acc, cur) => acc.concat(cur.roles || []),
    []
  );

  const hasRole = (r) => realmRoles.includes(r) || clientRoles.includes(r);

  return (
    <div>
      <h2>Aplicaciones disponibles</h2>
      <ul>
        {hasRole("admin") && (
          <li><a href="https://admin.tu-dominio.com" target="_blank" rel="noreferrer">Admin Panel</a></li>
        )}
        {hasRole("ventas") && (
          <li><a href="https://crm.tu-dominio.com" target="_blank" rel="noreferrer">CRM Ventas</a></li>
        )}
        {hasRole("soporte") && (
          <li><a href="https://tickets.tu-dominio.com" target="_blank" rel="noreferrer">Sistema de Tickets</a></li>
        )}
      </ul>

      <section style={{ marginTop: 20 }}>
        <h3>Detalles del usuario</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(userInfo || keycloak.tokenParsed, null, 2)}</pre>
      </section>
    </div>
  );
};

export default Dashboard;
