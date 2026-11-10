import React from "react";
import { Link } from "react-router-dom";

type ErrorPageProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function ErrorPage({
  title = "Something went wrong",
  message = "Something unexpected happened while loading this page.",
  actionLabel,
  onAction,
}: ErrorPageProps) {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center space-y-4">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Error
        </div>
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="text-foreground/80">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onAction && actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 rounded-lg bg-footer text-white hover:brightness-110"
            >
              {actionLabel}
            </button>
          ) : (
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-footer text-white hover:brightness-110"
            >
              Go back home
            </Link>
          )}
          <Link
            to="/"
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
