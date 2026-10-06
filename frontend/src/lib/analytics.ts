import posthog from "posthog-js";

// Product analytics (PostHog). Every function here is a no-op unless
// REACT_APP_POSTHOG_KEY was set at build time, so development and any build
// without a key send nothing.
//
// Events go to "/ingest" on our own domain; Caddy forwards them to PostHog.
// Many students run ad blockers that block PostHog's domain directly, which
// would undercount usage.

const key = process.env.REACT_APP_POSTHOG_KEY ?? "";
const apiHost = process.env.REACT_APP_POSTHOG_HOST || "/ingest";
// Where PostHog links in the toolbar point; must match the project's region.
const uiHost = process.env.REACT_APP_POSTHOG_UI_HOST || "https://us.posthog.com";

let enabled = false;

export function initAnalytics(): void {
  if (!key || enabled) return;
  posthog.init(key, {
    api_host: apiHost,
    ui_host: uiHost,
    // Only create person profiles for logged-in users; anonymous visitors
    // are still counted, just more cheaply.
    person_profiles: "identified_only",
    // Page views are sent by trackPageview() on every route change, since
    // React Router changes pages without a full browser navigation.
    capture_pageview: false,
    capture_pageleave: true,
  });
  enabled = true;
}

export function trackPageview(): void {
  if (enabled) posthog.capture("$pageview");
}

// Event names are past-tense actions in snake_case, e.g. "course_added".
// Keep properties free of personal data (no emails or names).
export function track(event: string, properties?: Record<string, unknown>): void {
  if (enabled) posthog.capture(event, properties);
}

// Ties events to an account by its numeric id only (no email or name), so
// returning users can be counted across devices.
export function identifyUser(userId: number | undefined): void {
  if (enabled && userId != null) posthog.identify(String(userId));
}

// On logout, start a fresh anonymous identity for whoever uses the browser next.
export function resetUser(): void {
  if (enabled) posthog.reset();
}
