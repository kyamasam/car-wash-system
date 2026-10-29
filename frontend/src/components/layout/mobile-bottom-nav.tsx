"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, NavItem } from "@/lib/nav-items";

const BAR_HREFS = [
  "/dashboard",
  "/dashboard/jobs",
  "/dashboard/billing/expenses",
  "/dashboard/billing",
];

const BAR_ITEMS = BAR_HREFS.map((href) => NAV_ITEMS.find((i) => i.href === href)).filter(
  (i): i is NavItem => Boolean(i),
);

/** The most specific NAV_ITEMS href matching the path, so /billing/expenses isn't "Billing". */
function matchNavHref(pathname: string): string | undefined {
  return NAV_ITEMS.filter(
    (i) =>
      pathname === i.href ||
      (i.href !== "/dashboard" && pathname.startsWith(`${i.href}/`)),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

interface MobileBottomNavProps {
  onMoreClick: () => void;
  isMoreActive: boolean;
}

export function MobileBottomNav({ onMoreClick, isMoreActive }: MobileBottomNavProps) {
  const pathname = usePathname();
  const activeHref = isMoreActive ? undefined : matchNavHref(pathname);
  const moreActive = isMoreActive || !BAR_HREFS.includes(activeHref ?? "");

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "md:hidden shrink-0 grid grid-cols-5",
        "border-t border-border bg-background",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {BAR_ITEMS.map((item) => {
        const isActive = activeHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="h-16"
          >
            <BarCell icon={item.icon} label={item.title} isActive={isActive} />
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onMoreClick}
        aria-label="More menu"
        aria-expanded={isMoreActive}
        className="h-16"
      >
        <BarCell icon={Menu} label="More" isActive={moreActive} />
      </button>
    </nav>
  );
}

/* ─── Bar Cell ───────────────────────────────── */
function BarCell({
  icon: Icon,
  label,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 transition-colors duration-200",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200",
          isActive && "bg-neutral/10",
        )}
      >
        <Icon size={20} strokeWidth={isActive ? 2.25 : 2} />
      </span>
      <span className={cn("text-[11px] leading-none", isActive ? "font-semibold" : "font-medium")}>
        {label}
      </span>
    </span>
  );
}
