import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { PaymentStatus } from "@/types";
import { Clock, FileText, CheckCircle } from "lucide-react";

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof Clock;
  }
> = {
  [PaymentStatus.PendingBill]: {
    variant: "pending",
    label: "Chờ lập hóa đơn",
    icon: Clock,
  },
  [PaymentStatus.AddedBill]: {
    variant: "partial",
    label: "Đã lập hóa đơn",
    icon: FileText,
  },
  [PaymentStatus.FullyPaid]: {
    variant: "paid",
    label: "Đã thanh toán",
    icon: CheckCircle,
  },
};

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
  showIcon?: boolean;
}

export function PaymentStatusBadge({
  status,
  className,
  showIcon = true,
}: PaymentStatusBadgeProps) {
  const config = PAYMENT_STATUS_CONFIG[status];

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
