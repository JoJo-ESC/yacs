const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.API_PROXY_TARGET || "http://localhost:8000";

module.exports = function setupProxy(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })
  );
};
