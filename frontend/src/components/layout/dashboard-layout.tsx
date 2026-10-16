"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { DashboardTopBar } from "./dashboard-top-bar";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";

// Only two width tokens — everything else comes from globals.css
import "@/styles/sidebar.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <TopNavigation />
      <div className="flex-1 p-2 flex gap-2 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          isMobile={isMobile}
        />
        {/* Main area slides right to clear the sidebar */}
        <div
          className={cn(
            "flex flex-col transition-all duration-300 flex-1 w-full",
          )}
        >
          <div className="relative">
            <DashboardTopBar
              onMenuClick={() => setIsSidebarOpen((o) => !o)}
              isMobile={isMobile}
            />
          </div>

          <main className="flex-1 px-2 py-2 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
