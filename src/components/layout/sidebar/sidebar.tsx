"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";
import { Tractor, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { siteConfig } from "@/config/site";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center border-b px-4">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Tractor className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none">
                  {siteConfig.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {siteConfig.tagline.split(",")[0]}
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Tractor className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav collapsed={collapsed} />
        </div>

        {/* Footer - Collapse Toggle */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed && "px-2")}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="mr-2 h-5 w-5" />
                <span>Thu gọn</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
