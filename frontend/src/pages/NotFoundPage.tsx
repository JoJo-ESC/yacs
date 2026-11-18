import React from "react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center space-y-4">
        <div className="text-6xl font-semibold text-foreground">404</div>
        <h1 className="text-3xl font-semibold text-foreground">Page not found</h1>
        <p className="text-foreground/80">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-footer text-white hover:brightness-110"
          >
            Go back home
          </Link>
          <Link
            to="/planner"
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
          >
            Open planner
          </Link>
        </div>
      </div>
    </main>
  );
}
