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
    configure: (jestConfig) => ({
      ...jestConfig,
      collectCoverageFrom: [
        "src/lib/schedule/schedule.ts",
        "src/context/schedule/schedule-context.tsx",
        "src/features/courses/components/SectionOptionList.tsx",
        "src/features/courses/components/SectionOptionCard.tsx",
        "src/features/schedule/components/SemesterSelect.tsx",
      ],
      coverageThreshold: {
        global: { statements: 90, branches: 85, functions: 90, lines: 90 },
        "./src/lib/schedule/schedule.ts": {
          statements: 100, branches: 100, functions: 100, lines: 100,
        },
      },
      moduleNameMapper: {
        ...jestConfig.moduleNameMapper,
        "^@/(.*)$": "<rootDir>/src/$1",
        "^react-router-dom$": "<rootDir>/node_modules/react-router-dom/dist/index.js",
        "^react-router$": "<rootDir>/node_modules/react-router/dist/development/index.js",
        "^react-router/dom$": "<rootDir>/node_modules/react-router/dist/development/dom-export.js",
      },
    }),
  },
};
