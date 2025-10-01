// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:4001", // 👈 mismo que SERVER_PORT
      changeOrigin: true,
    })
  );
};
