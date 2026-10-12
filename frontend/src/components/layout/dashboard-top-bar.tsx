"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { OrgSwitcher } from "./org-switcher";

interface DashboardTopBarProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

const SEGMENT_MAP: Record<string, string> = {
  dashboard: "Overview",
  vps: "VPS Instances",
  billing: "Billing",
  settings: "Settings",
};

export function DashboardTopBar({ onMenuClick, isMobile }: DashboardTopBarProps) {
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      const isLast = index === segments.length - 1;
      const label =
        SEGMENT_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, path, isLast };
    });
  }, [pathname]);

  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <header
      className={cn(
        "relative h-12 flex items-center justify-between px-6 shrink-0 w-full rounded-xl border border-white/30 border-b border-b-white/40 bg-white/15",
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="shrink-0 -ml-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {breadcrumbs.map((crumb) => (
              <div key={crumb.path} className="flex items-center gap-2">
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="font-semibold text-foreground">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-sm font-semibold md:hidden truncate">{pageTitle}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <OrgSwitcher />
        <div
          className={cn(
            "hidden md:flex items-center gap-2 w-48",
            "bg-background border border-border rounded-[9px]",
            "px-3 py-1.75 text-[13px] text-muted-foreground cursor-text",
          )}
        >
          <Search size={14} className="shrink-0" />
          <span>Search...</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowSearch((s) => !s)}
        >
          <Search className="h-5 w-5" />
        </Button>

        <div
          className={cn(
            "relative w-9 h-9 rounded-[9px] border border-border",
            "flex items-center justify-center cursor-pointer transition-all duration-200",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary",
          )}
        >
          <Bell size={15} strokeWidth={2} />
          <span className="absolute top-1.75 right-1.75 w-1.75 h-1.75 rounded-full bg-destructive border-[1.5px] border-card" />
        </div>
      </div>

      {/* Mobile search dropdown */}
      {showSearch && isMobile && (
        <div
          className={cn(
            "absolute top-17 left-0 right-0 p-4 z-20",
            "bg-background border-b border-border shadow-md",
          )}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search..."
              className="pl-10"
              onBlur={() => setShowSearch(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}
