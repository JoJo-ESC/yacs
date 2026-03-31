import * as React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { NavbarSearchField } from "@/components/ui/NavbarSearchField";

export function SubjectNavSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const targetPath = location.pathname === "/" ? "/" : "/courses";

  function updateQuery(nextQuery: string) {
    const nextParams = new URLSearchParams();

    if (nextQuery.trim()) {
      nextParams.set("q", nextQuery);
    }

    navigate(
      {
        pathname: targetPath,
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: location.pathname === targetPath },
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <NavbarSearchField
        id="subject-nav-search-input"
        value={query}
        onChange={updateQuery}
        onClear={() => updateQuery("")}
        placeholder="Search classes..."
        ariaLabel="Search subjects by subject code or name"
      />
    </div>
  );
}
