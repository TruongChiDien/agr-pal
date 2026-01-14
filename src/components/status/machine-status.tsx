import { StatusBadge, StatusBadgeProps } from "./status-badge";
import { MachineStatus } from "@/types";
import { CheckCircle, Zap, Wrench } from "lucide-react";

const MACHINE_STATUS_CONFIG: Record<
  MachineStatus,
  {
    variant: StatusBadgeProps["variant"];
    label: string;
    icon: typeof CheckCircle;
  }
> = {
  [MachineStatus.Available]: {
    variant: "available",
    label: "Sẵn sàng",
    icon: CheckCircle,
  },
  [MachineStatus.InUse]: {
    variant: "in-use",
    label: "Đang sử dụng",
    icon: Zap,
  },
  [MachineStatus.Maintenance]: {
    variant: "maintenance",
    label: "Bảo trì",
    icon: Wrench,
  },
};

export interface MachineStatusBadgeProps {
  status: MachineStatus;
  className?: string;
  showIcon?: boolean;
}

export function MachineStatusBadge({
  status,
  className,
  showIcon = true,
}: MachineStatusBadgeProps) {
  const config = MACHINE_STATUS_CONFIG[status];

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
