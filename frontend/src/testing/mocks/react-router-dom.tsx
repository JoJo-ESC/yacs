import React from "react";

type WithChildren = { children?: React.ReactNode };
type RouteProps = { element?: React.ReactNode; children?: React.ReactNode };
type LinkProps = { to: string; className?: string; children?: React.ReactNode };
type NavLinkProps = {
  to: string;
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
  children?: React.ReactNode;
};

export function BrowserRouter({ children }: WithChildren) {
  return <>{children}</>;
}

export function Routes({ children }: WithChildren) {
  return <>{children}</>;
}

export function Route({ element, children }: RouteProps) {
  return (
    <>
      {element}
      {children}
    </>
  );
}

export function Navigate() {
  return null;
}

export function Outlet() {
  return null;
}

export function Link({ to, className, children }: LinkProps) {
  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
}

export function NavLink({ to, className, children }: NavLinkProps) {
  const computedClassName =
    typeof className === "function" ? className({ isActive: false }) : className;
  return (
    <a href={to} className={computedClassName}>
      {children}
    </a>
  );
}

export function useNavigate() {
  return () => undefined;
}
