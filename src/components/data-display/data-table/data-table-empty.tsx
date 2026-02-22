import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableEmptyProps {
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function DataTableEmpty({
  message = "No data found",
  description = "Try adjusting your filters or search criteria",
  icon,
  action,
  className,
}: DataTableEmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 text-muted-foreground">
        {icon || <FileQuestion className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
