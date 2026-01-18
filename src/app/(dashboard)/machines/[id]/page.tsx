"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMachine } from "@/hooks/use-machines";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/format";
import { Edit, ArrowLeft } from "lucide-react";
import { MachineStatus } from "@/types/enums";

const statusConfig = {
  [MachineStatus.Available]: { bg: "bg-green-100", text: "text-green-700", label: "Sẵn sàng" },
  [MachineStatus.InUse]: { bg: "bg-blue-100", text: "text-blue-700", label: "Đang sử dụng" },
  [MachineStatus.Maintenance]: { bg: "bg-orange-100", text: "text-orange-700", label: "Bảo trì" },
};

export default function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: machine, isLoading } = useMachine(id);

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection
          title="Chi tiết máy"
          description="Đang tải thông tin máy..."
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!machine) {
    return (
      <PageContainer>
        <ContentSection
          title="Không tìm thấy"
          description="Máy không tồn tại hoặc đã bị xóa"
          actions={
            <Button variant="outline" onClick={() => router.push("/machines")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          }
        >
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">
                Không tìm thấy máy với ID: {id}
              </p>
            </CardContent>
          </Card>
        </ContentSection>
      </PageContainer>
    );
  }

  const config = statusConfig[machine.status as MachineStatus];

  return (
    <PageContainer>
      <ContentSection
        title={machine.name}
        description={`Mã máy: ${machine.id}`}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/machines/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={() => router.push("/machines")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        }
      >
        <Card>
          <CardContent className="grid gap-6 md:grid-cols-2 p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tên máy</p>
              <p className="font-medium text-lg">{machine.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
              <Badge className={`${config.bg} ${config.text} border-0`}>
                {config.label}
              </Badge>
            </div>
            {machine.model && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Model</p>
                <p className="font-medium text-lg">{machine.model}</p>
              </div>
            )}
            {machine.type && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Loại</p>
                <p className="font-medium text-lg">{machine.type}</p>
              </div>
            )}
            {machine.purchase_date && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ngày mua</p>
                <p className="font-medium text-lg">{formatDateShort(machine.purchase_date)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ngày tạo</p>
              <p className="font-medium text-lg">{formatDateShort(machine.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Future: Job history, maintenance logs */}
      </ContentSection>
    </PageContainer>
  );
}
