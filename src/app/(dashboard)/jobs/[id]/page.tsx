"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useJob, useDeleteJob, useUpdateJob } from "@/hooks/use-jobs";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusSelect } from "@/components/status/status-select";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ArrowLeft, Edit, Info, Trash2 } from "lucide-react";
import { JobStatus, JobPaymentStatus } from "@/types/enums";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UpdateJobDialog } from "@/components/jobs/update-job-dialog";

// Status options for Select
const JOB_STATUS_OPTIONS = [
  { value: JobStatus.New, label: "Mới", variant: "new" as const },
  { value: JobStatus.InProgress, label: "Đang xử lý", variant: "in-progress" as const },
  { value: JobStatus.Completed, label: "Hoàn thành", variant: "completed" as const },
  { value: JobStatus.Blocked, label: "Bị chặn", variant: "blocked" as const },
  { value: JobStatus.Canceled, label: "Đã hủy", variant: "canceled" as const },
];

function getPaymentStatusVariant(
  status: string
): "pending" | "partial" | "paid" {
  switch (status) {
    case JobPaymentStatus.PendingPayroll:
      return "pending";
    case JobPaymentStatus.AddedPayroll:
      return "partial";
    case JobPaymentStatus.FullyPaid:
      return "paid";
    default:
      return "pending";
  }
}


function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case JobPaymentStatus.PendingPayroll:
      return "Chưa tạo lương";
    case JobPaymentStatus.AddedPayroll:
      return "Đã tạo lương";
    case JobPaymentStatus.FullyPaid:
      return "Đã thanh toán";
    default:
      return status;
  }
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: job, isLoading } = useJob(id);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    await deleteJob.mutateAsync(id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/jobs");
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Chi tiết công việc" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!job) {
    return (
      <PageContainer>
        <ContentSection title="Không tìm thấy" description="Công việc không tồn tại">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-muted-foreground">Không tìm thấy công việc</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  // Get current base salary and weight for comparison
  const currentBaseSalary = Number(job.job_type.default_base_salary);
  const appliedBaseSalary = Number(job.applied_base);
  const baseSalaryChanged = currentBaseSalary !== appliedBaseSalary;

  // Find current worker weight
  const currentWorkerWeight = job.worker.worker_weights.find(
    (ww) => ww.job_type_id === job.job_type_id
  );
  const currentWeight = currentWorkerWeight ? Number(currentWorkerWeight.weight) : 1;
  const appliedWeight = Number(job.applied_weight);
  const weightChanged = currentWeight !== appliedWeight;

  return (
    <PageContainer>
      <ContentSection
        title="Chi tiết công việc"
        description={`Mã công việc: ${job.id.slice(0, 8).toUpperCase()}`}
        actions={
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={job.payment_status !== JobPaymentStatus.PendingPayroll}
                      className={job.payment_status !== JobPaymentStatus.PendingPayroll ? "opacity-50 pointer-events-none" : ""}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </Button>
                  </span>
                </TooltipTrigger>
                {job.payment_status !== JobPaymentStatus.PendingPayroll && (
                  <TooltipContent>
                    <p>Công việc đã có phiếu lương hoặc đã hoàn thành, không thể xóa</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(true)}
            >
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
        <div className="grid gap-6">
          {/* Job Info Card - First Component */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin công việc</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Công nhân</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-base text-primary hover:no-underline hover:text-primary/80"
                    onClick={() => router.push(`/workers/${job.worker.id}`)}
                  >
                    {job.worker.name}
                  </Button>
                  {job.worker.phone && (
                    <p className="text-sm text-muted-foreground">
                      {job.worker.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-base text-primary hover:no-underline hover:text-primary/80"
                    onClick={() => router.push(`/customers/${job.booking.customer.id}`)}
                  >
                    {job.booking.customer.name}
                  </Button>
                  {job.booking.customer.phone && (
                    <p className="text-sm text-muted-foreground">
                      {job.booking.customer.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dịch vụ</p>
                  <p className="font-medium">{job.booking.service.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loại công việc</p>
                  <p className="font-medium">{job.job_type.name}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Máy móc</p>
                  <p className="font-medium">
                    {job.machine?.name || <span className="text-muted-foreground">—</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đơn hàng</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-base text-primary hover:no-underline hover:text-primary/80"
                    onClick={() => router.push(`/bookings/${job.booking.id}`)}
                  >
                    {job.booking.id.slice(0, 8).toUpperCase()}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <div className="mt-1">
                    <StatusSelect
                      value={job.status}
                      options={JOB_STATUS_OPTIONS}
                      onValueChange={(value) => {
                        updateJob.mutate({ id: job.id, data: { status: value } });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thanh toán</p>
                  <div className="mt-1">
                    <StatusBadge
                      variant={getPaymentStatusVariant(job.payment_status)}
                      label={getPaymentStatusLabel(job.payment_status)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng</p>
                  <p className="font-medium">
                    {Number(job.actual_qty)} {job.job_type.service.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lương dự kiến</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(job.final_pay))}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {formatDateShort(job.created_at)}
                  </p>
                </div>
                {job.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ghi chú</p>
                    <p className="text-sm">{job.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wage Snapshot Card - Second Component */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    Lương được ghi nhận
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Lương cơ bản:</span>
                      <span className="font-medium text-blue-900">
                        {formatCurrency(appliedBaseSalary)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Hệ số:</span>
                      <span className="font-medium text-blue-900">
                        {appliedWeight.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-blue-700">Ngày cập nhật:</span>
                      <span className="font-medium text-blue-900">
                        {formatDateShort(job.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Comparison with current values */}
                  {(baseSalaryChanged || weightChanged) && (
                    <Alert className="mt-4 bg-amber-50 border-amber-200">
                      <AlertDescription className="text-xs text-amber-800">
                        <strong>So sánh với giá trị hiện tại:</strong>
                        <div className="mt-2 space-y-1">
                          {baseSalaryChanged && (
                            <div>
                              Lương cơ bản hiện tại: <strong>{formatCurrency(currentBaseSalary)}</strong>
                              {currentBaseSalary > appliedBaseSalary ? " (tăng)" : " (giảm)"}
                            </div>
                          )}
                          {weightChanged && (
                            <div>
                              Hệ số hiện tại: <strong>{currentWeight.toFixed(2)}</strong>
                              {currentWeight > appliedWeight ? " (tăng)" : " (giảm)"}
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          Lương đã ghi nhận không thay đổi ngay cả khi lương cơ bản hoặc hệ số thay đổi sau này.
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {!baseSalaryChanged && !weightChanged && (
                    <p className="text-xs text-blue-600 mt-3">
                      Lương cơ bản và hệ số vẫn giữ nguyên giá trị hiện tại
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa công việc này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteJob.isPending}
            >
              {deleteJob.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {job && (
        <UpdateJobDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          job={job}
        />
      )}
    </PageContainer>
  );
}
