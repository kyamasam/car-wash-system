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
    <nav className="flex-1 overflow-y-auto pb-2 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <SectionLabel label="Carwash Manager" isOpen={isOpen} />

      {mainItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isOpen={isOpen}
          isActive={pathname === item.href}
        />
      ))}

      {/* Divider */}
      <div className="h-px bg-sidebar-border mx-4 my-2" />

      <SectionLabel label="Other" isOpen={isOpen} />

      {otherItems.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          isOpen={isOpen}
          isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
        />
      ))}
    </nav>
  );
}

/* ─── Section Label (M3: on-surface-variant, title-small) ─── */
function SectionLabel({ label, isOpen }: { label: string; isOpen: boolean }) {
  return (
    <p
      className={cn(
        "text-sm font-medium text-muted-foreground",
        "px-4 pt-4 pb-2 whitespace-nowrap overflow-hidden",
        "transition-all duration-300",
        isOpen ? "opacity-100" : "opacity-0 h-0 p-0",
      )}
    >
      {label}
    </p>
  );
}

/* ─── Nav Link (M3 drawer item) ──────────────── */
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
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center rounded-full whitespace-nowrap",
        "transition-colors duration-200",
        isOpen ? "h-14 gap-3 px-4" : "h-12 justify-center px-0",

        isActive
          ? // Secondary container + on-secondary-container
            "bg-(--primary-muted) text-(--primary-dark) font-semibold"
          : // On-surface-variant with 8% state layer on hover
            "text-muted-foreground font-medium hover:bg-foreground/[0.08] hover:text-foreground",
      )}
    >
      <Icon size={20} strokeWidth={2} className="shrink-0" />

      {/* Label */}
      <span
        className={cn(
          "flex-1 text-sm transition-all duration-200",
          isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden",
        )}
      >
        {item.title}
      </span>

      {/* Trailing badge text */}
      {item.badge != null && isOpen && (
        <span className="text-xs font-medium shrink-0">{item.badge}</span>
      )}

      {/* Tooltip (collapsed state only) */}
      {!isOpen && (
        <span
          className={cn(
            "pointer-events-none absolute left-[calc(100%+12px)]",
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
