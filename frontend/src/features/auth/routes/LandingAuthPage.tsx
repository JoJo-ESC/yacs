import React, { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

type AuthMode = "login" | "signup";

export default function LandingAuthPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isGuest,
    isBusy,
    error,
    clearError,
    login,
    signup,
    continueAsGuest,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Form submitted, mode:", mode);

    const success =
      mode === "login"
        ? await login({ email, password })
        : await signup({ name, email, password });

    console.log("Signup/login result:", success);
    if (success) {
      navigate("/app", { replace: true });
    }
  };

  const handleContinueAsGuest = () => {
    continueAsGuest();
    navigate("/app", { replace: true });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-black/10">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-between bg-header p-8 md:p-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">YACS</h1>
              <p className="mt-3 text-sm text-input-foreground/80">
                Plan your schedule, track your progress, and stay ready for the semester.
              </p>
            </div>
            <div className="mt-10 space-y-4">
              <p className="rounded-xl border border-border bg-background/80 p-4 text-sm">
                Save schedules, build a 4-year plan, and keep your classes organized in one place.
              </p>
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
              >
                Continue as Guest
              </button>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-6 flex rounded-lg bg-background p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`w-1/2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`w-1/2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  mode === "signup" ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                Sign up
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Full name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-input-foreground outline-none ring-blue-500 transition focus:ring-2"
                    required
                  />
                </label>
              )}

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@school.edu"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-input-foreground outline-none ring-blue-500 transition focus:ring-2"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-input-foreground outline-none ring-blue-500 transition focus:ring-2"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full rounded-lg bg-footer px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {isBusy
                  ? "Please wait..."
                  : mode === "login"
                  ? "Log in to YACS"
                  : "Create account"}
              </button>
            </form>

            {error && (
              <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-xs text-input-foreground/80">
              By continuing, you agree to our{" "}
              <Link to="/app" className="underline hover:no-underline">
                terms
              </Link>{" "}
              and{" "}
              <Link to="/app" className="underline hover:no-underline">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
