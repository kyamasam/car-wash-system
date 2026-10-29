"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { SidebarToggle } from "./sidebar-toggle";
import { ModeToggle } from "@/components/theme/mode-toggle";

export interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

export function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();

  // Auto-close drawer on mobile when navigating
  useEffect(() => {
    if (isMobile && isOpen) setIsOpen(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isMobile]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          aria-hidden
          onClick={() => setIsOpen(false)}
          className={cn(
            // M3 scrim
            "fixed inset-0 z-40 bg-black/30",
            "transition-opacity",
          )}
        />
      )}

      {/* Sidebar panel — M3 navigation drawer (surface container low) */}
      <aside
        className={cn(
          "z-50 h-full flex flex-col shrink-0 bg-sidebar",
          "transition-all duration-300",

          // Width & slide behaviour
          isMobile
            ? [
                // Modal drawer: rounded end corners, no start border
                "fixed inset-y-0 left-0 w-[min(320px,85vw)] rounded-r-2xl shadow-xl",
                "border-r border-sidebar-border overflow-hidden",
                isOpen ? "translate-x-0" : "-translate-x-full",
              ]
            : [
                "border border-sidebar-border md:rounded-lg",
                isOpen ? "w-[240px]" : "w-[72px]",
              ],
        )}
      >
        <SidebarBrand isOpen={isOpen || isMobile} />

        <SidebarNav isOpen={isOpen || isMobile} />

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <SidebarToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        )}

        <div className="border-t border-border p-1 flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <UserMenu isOpen={isOpen} dropdownSide="top" />
          </div>
          {isMobile && <ModeToggle />}
        </div>
      </aside>
    </>
  );
}
