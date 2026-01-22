import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { JobPaymentStatus } from "@/types";
import { Clock, FileText, CheckCircle } from "lucide-react";

const JOB_PAYMENT_STATUS_CONFIG: Record<
  JobPaymentStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof Clock;
  }
> = {
  [JobPaymentStatus.PendingPayroll]: {
    variant: "pending",
    label: "Chờ lập phiếu lương",
    icon: Clock,
  },
  [JobPaymentStatus.AddedPayroll]: {
    variant: "partial",
    label: "Đã lập phiếu lương",
    icon: FileText,
  },
  [JobPaymentStatus.FullyPaid]: {
    variant: "paid",
    label: "Đã thanh toán",
    icon: CheckCircle,
  },
};

export interface JobPaymentStatusBadgeProps {
  status: JobPaymentStatus;
  className?: string;
  showIcon?: boolean;
}

export function JobPaymentStatusBadge({
  status,
  className,
  showIcon = true,
}: JobPaymentStatusBadgeProps) {
  const config = JOB_PAYMENT_STATUS_CONFIG[status];

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
