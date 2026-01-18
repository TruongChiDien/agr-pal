"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorker, useDeleteWorkerWeight } from "@/hooks/use-workers";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { WorkerWeightDialog } from "@/components/workers/worker-weight-dialog";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Worker_Weight, Job_Type } from "@prisma/client";

type WorkerWeightWithJobType = Worker_Weight & {
  job_type?: Job_Type & { service?: { name: string } };
};

export default function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: worker, isLoading } = useWorker(id);
  const deleteWeight = useDeleteWorkerWeight();

  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WorkerWeightWithJobType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weightToDelete, setWeightToDelete] = useState<string | null>(null);

  const handleDeleteWeightClick = (weightId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWeightToDelete(weightId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteWeightConfirm = async () => {
    if (weightToDelete) {
      await deleteWeight.mutateAsync(weightToDelete);
      setDeleteDialogOpen(false);
      setWeightToDelete(null);
    }
  };

  const handleEditWeight = (weight: WorkerWeightWithJobType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWeight(weight);
    setWeightDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setWeightDialogOpen(false);
    setEditingWeight(null);
  };

  const weightColumns: ColumnDef<WorkerWeightWithJobType>[] = [
    {
      key: "job_type",
      label: "Loại công việc",
      render: (item) => (
        <div>
          <p className="font-medium">{item.job_type?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">
            {item.job_type?.service?.name || ""}
          </p>
        </div>
      ),
    },
    {
      key: "default_base_salary",
      label: "Lương cơ bản",
      align: "right",
      width: "150px",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.job_type?.default_base_salary
            ? formatCurrency(Number(item.job_type.default_base_salary))
            : "—"}
        </span>
      ),
    },
    {
      key: "weight",
      label: "Hệ số",
      align: "right",
      width: "100px",
      render: (item) => (
        <Badge variant={Number(item.weight) >= 1 ? "default" : "secondary"}>
          {Number(item.weight).toFixed(1)}x
        </Badge>
      ),
    },
    {
      key: "final_salary",
      label: "Lương thực tế",
      align: "right",
      width: "150px",
      render: (item) => {
        if (!item.job_type?.default_base_salary) return <span>—</span>;
        const finalSalary =
          Number(item.job_type.default_base_salary) * Number(item.weight);
        return (
          <span className="font-medium text-primary">
            {formatCurrency(finalSalary)}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      align: "right",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleEditWeight(item, e)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteWeightClick(item.id, e)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Chi tiết công nhân" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!worker) {
    return (
      <PageContainer>
        <ContentSection title="Không tìm thấy" description="Công nhân không tồn tại">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title={worker.name}
        description="Thông tin chi tiết công nhân"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/workers/${id}/edit`)}>
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
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Tên</p>
              <p className="font-medium">{worker.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số điện thoại</p>
              <p className="font-medium">{worker.phone || "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Địa chỉ</p>
              <p className="font-medium">{worker.address || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Weights Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Hệ số lương</h3>
              <p className="text-sm text-muted-foreground">
                Quản lý hệ số lương theo loại công việc
              </p>
            </div>
            <Button onClick={() => setWeightDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm hệ số
            </Button>
          </div>

          <DataTable
            columns={weightColumns}
            data={worker.worker_weights || []}
            getRowId={(item) => item.id}
          />
        </div>

        {/* Job History Section (Future) */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tổng số công việc: {worker.jobs?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                (Chức năng chi tiết sẽ được bổ sung sau)
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Worker Weight Dialog */}
      <WorkerWeightDialog
        open={weightDialogOpen}
        onClose={handleCloseDialog}
        workerId={id}
        initialData={editingWeight || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa hệ số lương này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteWeightConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
