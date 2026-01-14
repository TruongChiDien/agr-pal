import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { BookingStatus } from "@/types";
import { Circle, Clock, CheckCircle, XCircle, Ban } from "lucide-react";

const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof Circle;
  }
> = {
  [BookingStatus.New]: {
    variant: "new",
    label: "Mới",
    icon: Circle,
  },
  [BookingStatus.InProgress]: {
    variant: "in-progress",
    label: "Đang thực hiện",
    icon: Clock,
  },
  [BookingStatus.Completed]: {
    variant: "completed",
    label: "Hoàn thành",
    icon: CheckCircle,
  },
  [BookingStatus.Blocked]: {
    variant: "blocked",
    label: "Tạm dừng",
    icon: Ban,
  },
  [BookingStatus.Canceled]: {
    variant: "canceled",
    label: "Đã hủy",
    icon: XCircle,
  },
};

export interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
  showIcon?: boolean;
}

export function BookingStatusBadge({
  status,
  className,
  showIcon = true,
}: BookingStatusBadgeProps) {
  const config = BOOKING_STATUS_CONFIG[status];

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
