"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusVariant } from "@/types";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface StatusOption {
  value: string;
  label: string;
  variant: StatusVariant;
}

interface StatusSelectProps {
  value: string;
  options: StatusOption[];
  onValueChange: (value: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Variant color mapping for text-only display
const VARIANT_TEXT_COLORS: Record<StatusVariant, string> = {
  "new": "text-blue-700 dark:text-blue-300",
  "in-progress": "text-orange-700 dark:text-orange-300",
  "completed": "text-green-700 dark:text-green-300",
  "blocked": "text-gray-700 dark:text-gray-300",
  "canceled": "text-red-700 dark:text-red-300",
  "pending": "text-yellow-700 dark:text-yellow-300",
  "partial": "text-amber-700 dark:text-amber-300",
  "paid": "text-emerald-700 dark:text-emerald-300",
  "open": "text-sky-700 dark:text-sky-300",
  "available": "text-teal-700 dark:text-teal-300",
  "in-use": "text-violet-700 dark:text-violet-300",
  "maintenance": "text-rose-700 dark:text-rose-300",
};

export function StatusSelect({
  value,
  options,
  onValueChange,
  disabled,
  placeholder = "Chọn trạng thái",
  className,
}: StatusSelectProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleSelect = async (newValue: string) => {
    if (newValue === value) {
      setOpen(false);
      return;
    }

    try {
      setIsPending(true);
      setOpen(false);
      await onValueChange(newValue);
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setIsPending(false);
    }
  };

  // Find current option to render trigger
  const currentOption = options.find((opt) => opt.value === value);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled || isPending}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 hover:bg-accent/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Đang lưu...</span>
              </div>
            ) : currentOption ? (
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-sm font-medium",
                  VARIANT_TEXT_COLORS[currentOption.variant]
                )}>
                  {currentOption.label}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[140px]">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="cursor-pointer"
            >
              <StatusBadge
                variant={option.variant}
                label={option.label}
                showIcon={true}
                className="border-0 bg-transparent px-0"
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
