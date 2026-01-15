"use client";

import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar/sidebar";
import { Header } from "./header/header";

interface AppShellProps {
  children: React.ReactNode
  className?: string
  user?: {
    name?: string | null
    email?: string | null
  }
}

export function AppShell({ children, className, user }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col transition-all duration-300 ml-64">
        {/* Header */}
        <Header user={user} />

        {/* Page Content */}
        <main className={cn("flex-1 overflow-y-auto bg-background", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
