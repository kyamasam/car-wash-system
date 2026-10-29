"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── Logo mark (shared with top-navigation) ─── */
export function AppLogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("w-full h-full", className)}>
      <rect width="36" height="36" rx="9" fill="#10b981" />
      <line x1="18" y1="18" x2="10" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="18" y1="18" x2="26" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="18" y1="18" x2="18" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="10" y1="11" x2="26" y2="11" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <circle cx="18" cy="18" r="3.5" fill="white" />
      <circle cx="10" cy="11" r="2.2" fill="white" opacity="0.9" />
      <circle cx="26" cy="11" r="2.2" fill="white" opacity="0.9" />
      <circle cx="18" cy="27" r="2.2" fill="white" opacity="0.9" />
    </svg>
  );
}

interface SidebarBrandProps {
  isOpen: boolean;
}

/* ─── Drawer headline (M3 "title" slot) ──────── */
export function SidebarBrand({ isOpen }: SidebarBrandProps) {
  return (
    <div
      className={cn(
        "flex items-center shrink-0 pt-5 pb-3 overflow-hidden transition-all duration-300",
        isOpen ? "px-6" : "px-0 justify-center",
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0" aria-label="Carwash Manager">
        <div className="w-8 h-8 shrink-0">
          <AppLogoMark />
        </div>

        <div
          className={cn(
            "flex flex-col leading-none whitespace-nowrap transition-all duration-300",
            isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
          )}
        >
          <span className="text-[17px] font-black tracking-tight text-primary/90 uppercase">Carwash</span>
          <span className="text-[9px] font-light tracking-[0.3em] text-primary uppercase">Manager</span>
        </div>
      </Link>
    </div>
  );
}
