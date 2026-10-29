"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { DashboardTopBar } from "./dashboard-top-bar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";

// Only two width tokens — everything else comes from globals.css
import "@/styles/sidebar.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type Breakpoint = "mobile" | "tablet" | "desktop";

const MOBILE_MAX = 767; // < md → off-canvas drawer
const TABLET_MAX = 1023; // md..lg → collapsed rail by default
const STORAGE_KEY = "sidebar-open";

function getBreakpoint(): Breakpoint {
  const w = window.innerWidth;
  if (w <= MOBILE_MAX) return "mobile";
  if (w <= TABLET_MAX) return "tablet";
  return "desktop";
}

function readDesktopPref(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const isMobile = breakpoint === "mobile";

  // Reset open state only when crossing a breakpoint, so resizing within one
  // doesn't override what the user chose.
  useEffect(() => {
    let current: Breakpoint | null = null;

    const sync = () => {
      const next = getBreakpoint();
      if (next === current) return;
      current = next;
      setBreakpoint(next);
      setIsSidebarOpen(next === "desktop" ? readDesktopPref() : false);
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const setOpen = useCallback(
    (open: boolean) => {
      setIsSidebarOpen(open);
      if (breakpoint === "desktop") {
        try {
          localStorage.setItem(STORAGE_KEY, String(open));
        } catch {}
      }
    },
    [breakpoint],
  );

  const toggle = useCallback(() => setOpen(!isSidebarOpen), [setOpen, isSidebarOpen]);

  // Ctrl/Cmd + B toggles the sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      {/* Mobile uses DashboardTopBar as its only bar */}
      <div className="hidden md:block">
        <TopNavigation />
      </div>
      <div className="flex-1 p-0 md:p-2 flex gap-2 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setOpen}
          isMobile={isMobile}
        />
        {/* Main area slides right to clear the sidebar */}
        <div
          className={cn(
            "flex flex-col transition-all duration-300 flex-1 w-full min-w-0",
          )}
        >
          <div className="relative">
            <DashboardTopBar
              onMenuClick={toggle}
              isMobile={isMobile}
              isSidebarOpen={isSidebarOpen}
            />
          </div>

          <main className="flex-1 px-4 pt-3 pb-4 md:p-2 overflow-y-auto max-md:has-data-fab:pb-24">
            {children}
          </main>

          {isMobile && (
            <MobileBottomNav onMoreClick={toggle} isMoreActive={isSidebarOpen} />
          )}
        </div>
      </div>
    </div>
  );
}
