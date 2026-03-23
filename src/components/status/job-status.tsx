import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { JobPaymentStatus } from "@/types";
import { Circle, CheckCircle, Clock } from "lucide-react";

export interface JobStatusBadgeProps {
  status: JobPaymentStatus;
  className?: string;
  showIcon?: boolean;
}

export function JobStatusBadge({
  status,
  className,
  showIcon = true,
}: JobStatusBadgeProps) {
  let config = { variant: "secondary", label: "Chưa tính", icon: Circle };

  switch (status) {
    case JobPaymentStatus.PendingPayroll:
      config = { variant: "secondary", label: "Chưa lên phiếu", icon: Clock };
      break;
    case JobPaymentStatus.AddedPayroll:
      config = { variant: "in-progress", label: "Đã lên phiếu", icon: Circle };
      break;
    case JobPaymentStatus.FullyPaid:
      config = { variant: "completed", label: "Đã thanh toán", icon: CheckCircle };
      break;
  }

  return (
    <StatusBadge
      variant={config.variant as any}
      label={config.label}
      icon={config.icon as any}
      className={className}
      showIcon={showIcon}
    />
  );
}
