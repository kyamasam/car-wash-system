"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface SidebarBrandProps {
  isOpen: boolean;
}

export function SidebarBrand({ isOpen }: SidebarBrandProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 min-h-[68px]",
        "border-b border-[var(--sidebar-border)]",
        "overflow-hidden transition-all duration-300",
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 shrink-0">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect width="36" height="36" rx="9" fill="#10b981"/>
            <line x1="18" y1="18" x2="10" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            <line x1="18" y1="18" x2="26" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            <line x1="18" y1="18" x2="18" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            <line x1="10" y1="11" x2="26" y2="11" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            <circle cx="18" cy="18" r="3.5" fill="white"/>
            <circle cx="10" cy="11" r="2.2" fill="white" opacity="0.9"/>
            <circle cx="26" cy="11" r="2.2" fill="white" opacity="0.9"/>
            <circle cx="18" cy="27" r="2.2" fill="white" opacity="0.9"/>
          </svg>
        </div>

        <span
          className={cn(
            "text-[15px] font-semibold text-[var(--sidebar-foreground)]",
            "whitespace-nowrap transition-all duration-300",
            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0",
          )}
        >
          Car Wash Manager
        </span>
      </Link>
    </div>
  );
}
