import React from "react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import ClassSearch from "@/features/schedule/components/ClassSearch";
import { SubjectNavSearch } from "@/features/courses/components/SubjectNavSearch";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const isBrowseRoute = location.pathname === "/" || location.pathname.startsWith("/courses");
  const navItems = React.useMemo(
    () => [
      { key: "browse", label: "Browse", to: "/", matches: (pathname: string) => pathname === "/" || pathname.startsWith("/courses") },
      { key: "planner", label: "4-Year Plan", to: "/planner", matches: (pathname: string) => pathname.startsWith("/planner") },
      { key: "schedule", label: "Schedule", to: "/schedule", matches: (pathname: string) => pathname.startsWith("/schedule") },
      { key: "profile", label: "Profile", to: "/profile", matches: (pathname: string) => pathname.startsWith("/profile") },
    ],
    [],
  );
  const activeKey = navItems.find((item) => item.matches(location.pathname))?.key ?? "browse";
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);
  const itemRefs = React.useRef<Record<string, HTMLAnchorElement | null>>({});
  const [bubbleStyle, setBubbleStyle] = React.useState({ x: 0, width: 0, opacity: 0 });
  const bubbleKey = hoveredKey ?? activeKey;

  React.useEffect(() => {
    const updateBubble = () => {
      const el = itemRefs.current[bubbleKey];
      if (!el) {
        setBubbleStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      setBubbleStyle({
        x: el.offsetLeft,
        width: el.offsetWidth,
        opacity: 1,
      });
    };

    updateBubble();
    window.addEventListener("resize", updateBubble);
    return () => window.removeEventListener("resize", updateBubble);
  }, [bubbleKey]);

  return (
    <>
      <div className="fixed inset-x-0 top-4 z-40 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/65 bg-[linear-gradient(135deg,_rgba(255,255,255,0.72)_0%,_rgba(252,249,244,0.62)_48%,_rgba(255,255,255,0.68)_100%)] px-5 py-3 text-input-foreground shadow-[0_22px_60px_-28px_rgba(15,23,42,0.18)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[linear-gradient(135deg,_rgba(255,255,255,0.58)_0%,_rgba(252,249,244,0.5)_48%,_rgba(255,255,255,0.56)_100%)] dark:border-white/10 dark:bg-[linear-gradient(135deg,_rgba(34,34,34,0.72)_0%,_rgba(24,24,24,0.68)_50%,_rgba(32,32,32,0.72)_100%)] dark:shadow-[0_26px_70px_-32px_rgba(0,0,0,0.7)] dark:supports-[backdrop-filter]:bg-[linear-gradient(135deg,_rgba(34,34,34,0.58)_0%,_rgba(24,24,24,0.54)_50%,_rgba(32,32,32,0.58)_100%)]">
          <div className="flex min-w-0 items-center gap-4 md:gap-6">
            <BrandLogo className="shrink-0" imageClassName="h-[38px] shrink-0" />
            <div className="min-w-0 w-full max-w-2xl">
              {isBrowseRoute ? (
                <SubjectNavSearch />
              ) : (
                <div className="max-w-md">
                  <ClassSearch />
                </div>
              )}
            </div>
          </div>
          <div className="invisible shrink-0 flex h-11 items-center gap-2 sm:visible">
            <div
              className="relative flex h-11 items-center gap-2"
              onMouseLeave={() => setHoveredKey(null)}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 rounded-full border border-[#dfc9ae] bg-[#f4ebe0] shadow-[0_8px_20px_-14px_rgba(107,75,44,0.28)] transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-[#6d4f36] dark:bg-[#3a281d]"
                style={{
                  width: `${bubbleStyle.width}px`,
                  opacity: bubbleStyle.opacity,
                  transform: `translateX(${bubbleStyle.x}px)`,
                }}
              />
              {navItems.map((item) => {
                const isHighlighted = bubbleKey === item.key;
                return (
                  <Link
                    key={item.key}
                    ref={(node) => {
                      itemRefs.current[item.key] = node;
                    }}
                    to={item.to}
                    onMouseEnter={() => setHoveredKey(item.key)}
                    onFocus={() => setHoveredKey(item.key)}
                    onBlur={() => setHoveredKey(null)}
                    className={`relative z-10 px-5 h-11 inline-flex items-center rounded-full text-sm font-semibold transition-colors duration-300 ${
                      isHighlighted
                        ? "text-[#7a5230] dark:text-[#f4e6d6]"
                        : "text-slate-700 dark:text-neutral-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <ThemeToggle className="h-11 w-11 rounded-full text-slate-700 hover:bg-[#faf5ee] hover:text-[#7a5230] dark:text-neutral-200 dark:hover:bg-[#201813]" />
          </div>
          <Bars3Icon className="h-6 w-6 text-slate-700 sm:hidden dark:text-neutral-200" />
        </div>
      </div>
      <div id="class-search-results-slot" className="w-full"></div>
    </>
  );
}
export default Navbar;
