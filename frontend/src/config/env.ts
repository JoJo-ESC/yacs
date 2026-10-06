type EnvConfig = {
  nodeEnv: string;
  apiBaseUrl: string;
};

export const env: EnvConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL ?? "",
};

// Where API requests go. An explicit REACT_APP_API_BASE_URL wins; otherwise
// development talks to the local backend, and production builds use "" (the
// same domain the site is served from, where Caddy forwards /api).
export function getApiBaseUrl(): string {
  if (env.apiBaseUrl) {
    return env.apiBaseUrl;
  }
  return env.nodeEnv === "development" ? "http://localhost:8000" : "";
}
