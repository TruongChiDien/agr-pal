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
    label: "Chính",
    items: [
      {
        id: "dashboard",
        label: "Bảng điều khiển",
        href: "/dashboard",
        icon: LayoutDashboard,
        enabled: true,
      },
    ],
  },
  {
    id: "operations",
    label: "Hoạt động",
    items: [
      {
        id: "bookings",
        label: "Đơn hàng",
        href: "/bookings",
        icon: CalendarDays,
        enabled: true,
      },
      {
        id: "jobs",
        label: "Công việc",
        href: "/jobs",
        icon: Briefcase,
        enabled: true,
      },
    ],
  },
  {
    id: "people",
    label: "Nhân sự & Đất đai",
    items: [
      {
        id: "customers",
        label: "Khách hàng",
        href: "/customers",
        icon: Users,
        enabled: true,
      },
      {
        id: "workers",
        label: "Công nhân",
        href: "/workers",
        icon: Users,
        enabled: true,
      },
    ],
  },
  {
    id: "financial",
    label: "Tài chính",
    items: [
      {
        id: "billing",
        label: "Hóa đơn",
        href: "/bills",
        icon: Receipt,
        enabled: true,
      },
      {
        id: "payroll",
        label: "Lương bổng",
        href: "/payroll",
        icon: Wallet,
        enabled: true,
      },
    ],
  },
  {
    id: "assets",
    label: "Tài sản & Dịch vụ",
    items: [
      {
        id: "machines",
        label: "Máy móc",
        href: "/machines",
        icon: Tractor,
        enabled: true,
      },
      {
        id: "services",
        label: "Dịch vụ",
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
