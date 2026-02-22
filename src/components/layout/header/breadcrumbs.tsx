"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { getNavItemByHref } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always add home
    breadcrumbs.push({
      label: "Bảng điều khiển",
      href: "/dashboard",
      isHome: true,
    });

    // Build breadcrumbs from path segments
    let currentPath = "";
    for (const segment of segments) {
      currentPath += `/${segment}`;

      // Try to get label from navigation config
      const navItem = getNavItemByHref(currentPath);
      const label = navItem?.label || segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label,
        href: currentPath,
        isHome: false,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs if we're on the dashboard
  if (pathname === "/dashboard" || pathname === "/") {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={crumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-2 h-4 w-4" />}

            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "flex items-center gap-1 transition-colors hover:text-foreground",
                  crumb.isHome && "text-primary hover:text-primary/80"
                )}
              >
                {crumb.isHome && <Home className="h-4 w-4" />}
                <span>{crumb.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
