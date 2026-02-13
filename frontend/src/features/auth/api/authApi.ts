import { env } from "@/config";

type ApiEnvelope = {
  success?: boolean;
  status?: string;
  message?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  major?: string;
  degree?: string;
};

export type AuthApiResult = ApiEnvelope & {
  ok: boolean;
  statusCode: number;
};

function getApiBaseUrl() {
  if (env.apiBaseUrl) {
    return env.apiBaseUrl;
  }
  return env.nodeEnv === "development" ? "http://localhost:8000" : "";
}

function buildApiUrl(path: string) {
  const base = getApiBaseUrl();
  return `${base}${path}`;
}

async function sendJson(path: string, init: RequestInit): Promise<AuthApiResult> {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope) : {};

  return {
    ok: response.ok,
    statusCode: response.status,
    ...payload,
  };
}

export function loginUser(payload: LoginRequest) {
  return sendJson("/api/session", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function signupUser(payload: SignupRequest) {
  return sendJson("/api/user", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      phone: payload.phone ?? "",
      password: payload.password,
      major: payload.major ?? "Undeclared",
      degree: payload.degree ?? "BS",
    }),
  });
}

export function logoutUser() {
  return sendJson("/api/session", {
    method: "DELETE",
  });
}
