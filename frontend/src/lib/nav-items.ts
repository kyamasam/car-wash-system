import { BarChart3, Car, LayoutDashboard, Settings, Users, Wrench, Wallet } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  section: "main" | "other";
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "main",
  },
  {
    title: "Jobs",
    href: "/dashboard/jobs",
    icon: Car,
    section: "main",
  },
  {
    title: "Workers",
    href: "/dashboard/workers",
    icon: Users,
    section: "main",
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    section: "main",
  },
  {
    title: "Services",
    href: "/dashboard/services",
    icon: Wrench,
    section: "main",
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: Wallet,
    section: "main",
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    section: "main",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    section: "other",
  },
];
