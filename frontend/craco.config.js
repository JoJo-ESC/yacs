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
      },
    },
  },
};
