import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  Users,
  MapPin,
  Receipt,
  Wallet,
  Tractor,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  enabled: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const navigationConfig: NavGroup[] = [
  {
    id: "main",
    label: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        enabled: true,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        id: "bookings",
        label: "Bookings",
        href: "/bookings",
        icon: CalendarDays,
        enabled: true,
      },
      {
        id: "jobs",
        label: "Jobs",
        href: "/jobs",
        icon: Briefcase,
        enabled: true,
      },
    ],
  },
  {
    id: "people",
    label: "People & Land",
    items: [
      {
        id: "customers",
        label: "Customers",
        href: "/customers",
        icon: Users,
        enabled: true,
      },
      {
        id: "workers",
        label: "Workers",
        href: "/workers",
        icon: Users,
        enabled: true,
      },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    items: [
      {
        id: "billing",
        label: "Billing",
        href: "/bills",
        icon: Receipt,
        enabled: true,
      },
      {
        id: "payroll",
        label: "Payroll",
        href: "/payroll",
        icon: Wallet,
        enabled: true,
      },
    ],
  },
  {
    id: "assets",
    label: "Assets & Services",
    items: [
      {
        id: "machines",
        label: "Machines",
        href: "/machines",
        icon: Tractor,
        enabled: true,
      },
      {
        id: "services",
        label: "Services",
        href: "/services",
        icon: Wrench,
        enabled: true,
      },
    ],
  },
];

// Flatten navigation for quick access
export const allNavItems = navigationConfig.flatMap((group) => group.items);

// Get navigation item by ID
export function getNavItem(id: string): NavItem | undefined {
  return allNavItems.find((item) => item.id === id);
}

// Get navigation item by href
export function getNavItemByHref(href: string): NavItem | undefined {
  return allNavItems.find((item) => item.href === href);
}
