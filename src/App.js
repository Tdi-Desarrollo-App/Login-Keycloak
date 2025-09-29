import React, { useEffect, useState } from 'react';
import keycloak from './keycloak';

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    keycloak.init({ onLoad: 'login-required' }).then(authenticated => {
      setAuthenticated(authenticated);
    });
  }, []);

  if (!authenticated) return <div>Loading...</div>;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Bienvenido, {keycloak.tokenParsed?.preferred_username}</h1>
      <p>Tu token JWT es:</p>
      <textarea
        readOnly
        style={{ width: '80%', height: '150px' }}
        value={keycloak.token}
      />
      <br /><br />
      <button onClick={() => keycloak.logout({ redirectUri: 'http://localhost:3000/' })}>
        Cerrar sesión
      </button>
    </div>
  );
}

export default App;
