import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatusVariant } from "@/types";
import { LucideIcon } from "lucide-react";

export interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  icon?: LucideIcon;
  className?: string;
  showIcon?: boolean;
}

// Status style configuration with WCAG AA compliant colors
const STATUS_STYLES: Record<
  StatusVariant,
  {
    bg: string;
    text: string;
    border: string;
  }
> = {
  new: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-700 dark:border-blue-300",
  },
  "in-progress": {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-700 dark:border-orange-300",
  },
  completed: {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-700 dark:border-green-300",
  },
  blocked: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-700 dark:border-gray-300",
  },
  canceled: {
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-700 dark:border-red-300",
  },
  pending: {
    bg: "bg-yellow-100 dark:bg-yellow-950",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-700 dark:border-yellow-300",
  },
  partial: {
    bg: "bg-amber-100 dark:bg-amber-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-700 dark:border-amber-300",
  },
  paid: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-700 dark:border-emerald-300",
  },
  open: {
    bg: "bg-sky-100 dark:bg-sky-950",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-700 dark:border-sky-300",
  },
  available: {
    bg: "bg-teal-100 dark:bg-teal-950",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-700 dark:border-teal-300",
  },
  "in-use": {
    bg: "bg-violet-100 dark:bg-violet-950",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-700 dark:border-violet-300",
  },
  maintenance: {
    bg: "bg-rose-100 dark:bg-rose-950",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-700 dark:border-rose-300",
  },
};

export function StatusBadge({
  variant,
  label,
  icon: Icon,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const style = STATUS_STYLES[variant];

  return (
    <Badge
      className={cn(
        "font-medium border",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {showIcon && Icon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}
