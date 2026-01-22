"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMachine, useDeleteMachine } from "@/hooks/use-machines";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateShort } from "@/lib/format";
import { Edit, ArrowLeft, Trash2 } from "lucide-react";
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
  const deleteMachine = useDeleteMachine();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    await deleteMachine.mutateAsync(id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/machines");
      },
    });
  };

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
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
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
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
            <Button variant="outline" onClick={() => router.push(`/machines/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa máy "{machine.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMachine.isPending}
            >
              {deleteMachine.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
