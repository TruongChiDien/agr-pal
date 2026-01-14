import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { BillStatus } from "@/types";
import { FileText, DollarSign, CheckCircle } from "lucide-react";

const BILL_STATUS_CONFIG: Record<
  BillStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof FileText;
  }
> = {
  [BillStatus.Open]: {
    variant: "open",
    label: "Chưa thanh toán",
    icon: FileText,
  },
  [BillStatus.PartialPaid]: {
    variant: "partial",
    label: "Thanh toán một phần",
    icon: DollarSign,
  },
  [BillStatus.Completed]: {
    variant: "completed",
    label: "Đã thanh toán",
    icon: CheckCircle,
  },
};

export interface BillStatusBadgeProps {
  status: BillStatus;
  className?: string;
  showIcon?: boolean;
}

export function BillStatusBadge({
  status,
  className,
  showIcon = true,
}: BillStatusBadgeProps) {
  const config = BILL_STATUS_CONFIG[status];

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
