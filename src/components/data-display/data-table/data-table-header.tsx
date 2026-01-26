import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface DataTableHeaderProps {
  label: string;
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
  className?: string;
  align?: "left" | "center" | "right";
}

export function DataTableHeader({
  label,
  sortable = false,
  sortDirection = null,
  onSort,
  className,
  align = "left",
}: DataTableHeaderProps) {
  const alignmentClasses = {
    left: "text-left justify-start",
    center: "text-center justify-center",
    right: "text-right justify-end",
  };

  if (!sortable || !onSort) {
    return (
      <div
        className={cn(
          "flex items-center font-medium text-sm h-10 px-4",
          alignmentClasses[align],
          className
        )}
      >
        <span className={cn(
          align === "center" && "w-full text-center",
          align === "right" && "w-full text-right"
        )}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onSort}
      className={cn(
        "h-10 px-4 font-medium hover:bg-accent w-full",
        alignmentClasses[align],
        className
      )}
    >
      <span className={cn(
        align === "center" && "flex-1 text-center",
        align === "left" && "flex-1 text-left"
      )}>{label}</span>
      <div className="ml-2 h-4 w-4 flex-shrink-0">
        {sortDirection === "asc" && <ArrowUp className="h-4 w-4" />}
        {sortDirection === "desc" && <ArrowDown className="h-4 w-4" />}
        {sortDirection === null && <ArrowUpDown className="h-4 w-4 opacity-50" />}
      </div>
    </Button>
  );
}
