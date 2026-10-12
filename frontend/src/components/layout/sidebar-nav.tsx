"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, NavItem } from "@/lib/nav-items";

interface SidebarNavProps {
  isOpen: boolean;
}

export function SidebarNav({ isOpen }: SidebarNavProps) {
  const pathname = usePathname();

  const mainItems = NAV_ITEMS.filter((i) => i.section === "main");
  const otherItems = NAV_ITEMS.filter((i) => i.section === "other");

  return (
    <nav className="flex-1 overflow-y-auto py-2 px-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <SectionLabel label="Main Menu" isOpen={isOpen} />

      {mainItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isOpen={isOpen}
          isActive={pathname === item.href}
        />
      ))}

      {/* Divider */}
      {/* <div className="h-px bg-[var(--sidebar-border)] my-2" />

      <SectionLabel label="Other" isOpen={isOpen} />

      {otherItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isOpen={isOpen}
          isActive={pathname === item.href}
        />
      ))} */}
    </nav>
  );
}

/* ─── Section Label ──────────────────────────── */
function SectionLabel({ label, isOpen }: { label: string; isOpen: boolean }) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold tracking-[0.08em] uppercase",
        "text-(--neutral-muted) px-2 pt-4 pb-1.5 whitespace-nowrap overflow-hidden",
        "transition-all duration-300",
        isOpen ? "opacity-100" : "opacity-0",
      )}
    >
      {label}
    </p>
  );
}

/* ─── Nav Link ───────────────────────────────── */
function NavLink({
  item,
  isOpen,
  isActive,
}: {
  item: NavItem;
  isOpen: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2 px-4 py-2",
        "rounded-full mb-0.5 whitespace-nowrap transition-all duration-200",

        isActive
          ? [
              // Active: yellow bg, dark text (uses your --primary + --primary-foreground)
              "bg-neutral/10 text-primary-foreground",
              "text-sm font-semibold",
            ]
          : [
              // Idle: transparent; hover → very light foreground tint
              "text-muted-foreground opacity-70",
              "hover:opacity-100 hover:bg-neutral-border",
            ],
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "rounded flex items-center justify-center shrink-0",
          "transition-all duration-200",
          isActive
            ? " text-muted" // dark circle on yellow bg
            : "text-inherit",
        )}
      >
        <Icon size={14} strokeWidth={2} />
      </div>

      {/* Label */}
      <span
        className={cn(
          "flex-1 text-[13.5px] font-medium transition-all duration-200",
          isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
        )}
      >
        {item.title}
      </span>

      {/* Notification badge */}
      {item.badge && (
        <span
          className={cn(
            "text-[10px] font-light px-1.5 py-px rounded-full min-w-4.5 text-center shrink-0",
            // Use error colour for badges
            "bg-error text-accent-foreground",
            "transition-all duration-200",
            isOpen ? "opacity-100" : "opacity-0",
          )}
        >
          {item.badge}
        </span>
      )}

      {/* Tooltip (collapsed state only) */}
      {!isOpen && (
        <span
          className={cn(
            "pointer-events-none absolute left-[calc(var(--sidebar-collapsed-w,72px)+8px)]",
            "top-1/2 -translate-y-1/2 z-999",
            "bg-foreground text-background",
            "text-xs font-medium px-2 py-1.25 rounded-[7px] whitespace-nowrap",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          )}
        >
          {item.title}
        </span>
      )}
    </Link>
  );
}
