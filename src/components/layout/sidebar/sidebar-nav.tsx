"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigationConfig, type NavItem } from "@/config/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarNavProps {
  collapsed?: boolean;
}

export function SidebarNav({ collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav className="flex flex-col gap-1">
      {navigationConfig.map((group, groupIndex) => (
        <div key={group.id} className="space-y-1">
          {groupIndex > 0 && <Separator className="my-2" />}

          {!collapsed && (
            <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h3>
          )}

          {group.items
            .filter((item) => item.enabled)
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Button
                  key={item.id}
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 transition-colors",
                    active &&
                      "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Link href={item.href}>
                    <Icon className={cn("h-5 w-5", collapsed && "h-6 w-6")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <ChevronRight className="h-4 w-4 text-primary" />
                        )}
                      </>
                    )}
                  </Link>
                </Button>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
