import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  Receipt,
  Wallet,
  Tractor,
  Settings2,
  Package,
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
        id: "work-days",
        label: "Ngày làm việc",
        href: "/work-days",
        icon: CalendarDays,
        enabled: true,
      },
      {
        id: "bookings",
        label: "Đơn hàng",
        href: "/bookings",
        icon: BookOpen,
        enabled: true,
      },
      {
        id: "services",
        label: "Dịch vụ",
        href: "/services",
        icon: Package,
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
    label: "Tài sản & Cài đặt",
    items: [
      {
        id: "machines",
        label: "Máy móc",
        href: "/machines",
        icon: Tractor,
        enabled: true,
      },
      {
        id: "machine-types",
        label: "Loại máy & Vị trí",
        href: "/machine-types",
        icon: Settings2,
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
