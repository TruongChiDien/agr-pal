import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { JobStatus } from "@/types";
import { Circle, Clock, CheckCircle, XCircle, Ban } from "lucide-react";

const JOB_STATUS_CONFIG: Record<
  JobStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof Circle;
  }
> = {
  [JobStatus.New]: {
    variant: "new",
    label: "Mới",
    icon: Circle,
  },
  [JobStatus.InProgress]: {
    variant: "in-progress",
    label: "Đang thực hiện",
    icon: Clock,
  },
  [JobStatus.Completed]: {
    variant: "completed",
    label: "Hoàn thành",
    icon: CheckCircle,
  },
  [JobStatus.Blocked]: {
    variant: "blocked",
    label: "Tạm dừng",
    icon: Ban,
  },
  [JobStatus.Canceled]: {
    variant: "canceled",
    label: "Đã hủy",
    icon: XCircle,
  },
};

export interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
  showIcon?: boolean;
}

export function JobStatusBadge({
  status,
  className,
  showIcon = true,
}: JobStatusBadgeProps) {
  const config = JOB_STATUS_CONFIG[status];

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
