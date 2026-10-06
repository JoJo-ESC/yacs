import * as React from "react";

import { fetchJson } from "@/api";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

type LoginResponse = {
  success?: boolean;
  message?: string;
};

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetchJson<LoginResponse>("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        setMessage(response.message ?? "Signed in successfully.");
        return;
      }

      setError(response.message ?? "We could not sign you in. Check your credentials and try again.");
    } catch {
      setError("We could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface/60 p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">Account</p>
          <h1 className="text-3xl font-semibold text-foreground">Log in</h1>
          <p className="text-sm text-foreground/70">
            Sign in to save schedules and access your profile.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-footer/30"
              placeholder="you@rpi.edu"
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-footer/30"
              placeholder="Enter your password"
              disabled={isSubmitting}
              required
            />
          </label>

          <Button
            type="submit"
            className="min-h-[44px] w-full bg-footer text-white hover:brightness-110"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" label="Signing in" />
                <span>Signing in...</span>
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        {isSubmitting && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-sm text-foreground/75">
            <Spinner size="sm" label="Signing in" />
            <span>Checking your credentials and starting your session.</span>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
