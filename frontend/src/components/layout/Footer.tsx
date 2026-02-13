import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Footer() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode
    const isDarkMode = document.documentElement.classList.contains('dark') ||
                       window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);

    // Listen for dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const logoSrc = isDark ? '/logo/white-for-web.png' : '/logo/black-white-for-web.png';

  return (
    <footer className="bg-header text-input-foreground border-t border-b-border">
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-12 gap-6 items-start">
        {/* logo */}
        <div className="col-span-3 flex items-center">
          <div className="inline-flex items-center justify-center border-2 border-white rounded-xl px-4 py-2 bg-transparent text-white text-lg font-semibold">
            RCOS
          </div>
          <img src={logoSrc} alt="yacs logo" className="mt-2 h-8 w-auto" />
        </div>

        {/* link columns */}
        <nav className="col-span-6 grid grid-cols-2 gap-6">
          <ul className="space-y-2">
            <li><Link className="text-sm tracking-wider hover:underline" to="/app">schedule</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/explore">explore</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/finals">finals</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/professors">professors</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/pathways">pathways</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/prerequisites">prerequisites</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/app/planner">degree planner</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/app/profile">my account</Link></li>
          </ul>

          <ul className="space-y-2">
            <li><Link className="text-sm tracking-wider hover:underline" to="/request-feature">request a feature</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/report-bug">report a bug</Link></li>
            <li><a className="text-sm tracking-wider hover:underline" href="https://github.com" target="_blank" rel="noopener noreferrer">github</a></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/about-rcos">about RCOS</Link></li>
            <li><Link className="text-sm tracking-wider hover:underline" to="/about-yacs">about the YACS team</Link></li>
          </ul>
        </nav>

        {/* spacer / optional content */}
        <div className="col-span-3 flex items-start justify-end">
          {/* place for social links or short info if needed */}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
