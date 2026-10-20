const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  devServer: (devServerConfig) => {
    const { allowedHosts } = devServerConfig;

    if (Array.isArray(allowedHosts)) {
      const sanitizedHosts = allowedHosts.filter(
        (host) => typeof host === "string" && host.trim().length > 0
      );

      devServerConfig.allowedHosts =
        sanitizedHosts.length > 0 ? sanitizedHosts : "all";
    }

    return devServerConfig;
  },
  jest: {
    configure: {
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js",
        "^react-router$": "<rootDir>/node_modules/react-router/dist/development/index.js",
        "^react-router/dom$": "<rootDir>/node_modules/react-router/dist/development/dom-export.js",
      },
    },
  },
};
