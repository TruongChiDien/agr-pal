import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { AdvanceStatus } from "@/types";
import { Clock, CheckCircle } from "lucide-react";

const ADVANCE_STATUS_CONFIG: Record<
  AdvanceStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof Clock;
  }
> = {
  [AdvanceStatus.Unprocessed]: {
    variant: "pending",
    label: "Chưa xử lý",
    icon: Clock,
  },
  [AdvanceStatus.Processed]: {
    variant: "paid",
    label: "Đã xử lý",
    icon: CheckCircle,
  },
};

export interface AdvanceStatusBadgeProps {
  status: AdvanceStatus;
  className?: string;
  showIcon?: boolean;
}

export function AdvanceStatusBadge({
  status,
  className,
  showIcon = true,
}: AdvanceStatusBadgeProps) {
  const config = ADVANCE_STATUS_CONFIG[status];

  return (
    <StatusBadge
      variant={config.variant}
      label={config.label}
      icon={config.icon}
      className={className}
      showIcon={showIcon}
    />
  );
}
