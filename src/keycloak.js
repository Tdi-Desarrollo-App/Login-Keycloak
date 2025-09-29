import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://auth.devcastellanos.site/',
  realm: 'Login',        // tu realm
  clientId: 'react-app', // tu cliente
});

export default keycloak;
