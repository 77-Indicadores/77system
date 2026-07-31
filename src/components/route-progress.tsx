"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // New route loaded — complete and hide
      setWidth(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
      prevPathname.current = pathname;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // On mount, expose a way to start progress from nav-links
  useEffect(() => {
    function onNavStart() {
      setVisible(true);
      setWidth(30);
      timerRef.current = setTimeout(() => setWidth(70), 200);
    }
    window.addEventListener("nav:start", onNavStart);
    return () => window.removeEventListener("nav:start", onNavStart);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[200] h-[2px] transition-all duration-300 ease-out"
      style={{
        width: `${width}%`,
        background: "hsl(var(--primary))",
        boxShadow: "0 0 8px hsl(var(--primary) / 0.6)",
      }}
    />
  );
}
