"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { SidebarBrand } from "./sidebar-brand";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { SidebarToggle } from "./sidebar-toggle";

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
            "fixed inset-0 z-40",
            "bg-[var(--foreground)]/40 backdrop-blur-[2px]",
            "transition-opacity",
          )}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          " border border-border z-50 h-full flex flex-col",
          // Colours from your globals
          "bg-background md:rounded-lg",
          "transition-all duration-300 ",

          // Width & slide behaviour
          isMobile
            ? isOpen
              ? "w-[240px] translate-x-0"
              : "w-[240px] -translate-x-full"
            : isOpen
              ? "w-[240px]"
              : "w-[72px]",
        )}
      >
        {/* <SidebarBrand isOpen={isOpen} /> */}

        <SidebarNav isOpen={isOpen} />

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <SidebarToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        )}
        
        <UserMenu isOpen={isOpen} dropdownSide="top" />
      </aside>
    </>
  );
}
