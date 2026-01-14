import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { PayrollStatus } from "@/types";
import { FileText, DollarSign, CheckCircle } from "lucide-react";

const PAYROLL_STATUS_CONFIG: Record<
  PayrollStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof FileText;
  }
> = {
  [PayrollStatus.Open]: {
    variant: "open",
    label: "Chưa thanh toán",
    icon: FileText,
  },
  [PayrollStatus.PartialPaid]: {
    variant: "partial",
    label: "Thanh toán một phần",
    icon: DollarSign,
  },
  [PayrollStatus.Completed]: {
    variant: "completed",
    label: "Đã thanh toán",
    icon: CheckCircle,
  },
};

export interface PayrollStatusBadgeProps {
  status: PayrollStatus;
  className?: string;
  showIcon?: boolean;
}

export function PayrollStatusBadge({
  status,
  className,
  showIcon = true,
}: PayrollStatusBadgeProps) {
  const config = PAYROLL_STATUS_CONFIG[status];

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
