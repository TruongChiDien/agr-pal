"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking, useDeleteBooking, useUpdateBooking, useUpdateBookingWithJobs } from "@/hooks/use-bookings";
import { useDeleteJob, useUpdateJob } from "@/hooks/use-jobs";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusSelect } from "@/components/status/status-select";
import { formatCurrency, formatDateShort } from "@/lib/format";

import { ArrowLeft, Edit, Info, Plus, Trash2 } from "lucide-react";
import { BookingStatus, PaymentStatus, JobStatus } from "@/types/enums";
import { handleBookingStatusUpdate } from "@/lib/booking-status-utils";
import { CreateJobDialog } from "@/components/jobs/create-job-dialog";
import { UpdateJobDialog } from "@/components/jobs/update-job-dialog";
import { UpdateBookingDialog } from "@/components/bookings/update-booking-dialog";
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


// Status options for Booking Select
const BOOKING_STATUS_OPTIONS = [
  { value: BookingStatus.New, label: "Mới", variant: "new" as const },
  { value: BookingStatus.InProgress, label: "Đang xử lý", variant: "in-progress" as const },
  { value: BookingStatus.Completed, label: "Hoàn thành", variant: "completed" as const },
  { value: BookingStatus.Blocked, label: "Bị chặn", variant: "blocked" as const },
  { value: BookingStatus.Canceled, label: "Đã hủy", variant: "canceled" as const },
];

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
    case PaymentStatus.PendingBill:
      return "pending";
    case PaymentStatus.AddedBill:
      return "partial";
    case PaymentStatus.FullyPaid:
      return "paid";
    default:
      return "pending";
  }
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case PaymentStatus.PendingBill:
      return "Chưa tạo HĐ";
    case PaymentStatus.AddedBill:
      return "Đã tạo HĐ";
    case PaymentStatus.FullyPaid:
      return "Đã thanh toán";
    default:
      return status;
  }
}

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: booking, isLoading } = useBooking(id);
  const updateBooking = useUpdateBooking();
  const updateBookingWithJobs = useUpdateBookingWithJobs();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const deleteBooking = useDeleteBooking();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [deleteBookingDialogOpen, setDeleteBookingDialogOpen] = useState(false);

  // State for completion confirmation
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [incompleteJobCount, setIncompleteJobCount] = useState(0);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;

    await handleBookingStatusUpdate({
      bookingId: booking.id,
      currentStatus: booking.status,
      newStatus,
      onNeedConfirmation: (count) => {
        setIncompleteJobCount(count);
        setTargetStatus(newStatus);
        setCompletionDialogOpen(true);
      },
      onProceedWithoutJobs: async () => {
        await updateBooking.mutateAsync({
          id: booking.id,
          data: { status: newStatus },
        });
      },
    });
  };

  const handleConfirmCompletion = async (completeJobs: boolean) => {
    if (!booking || !targetStatus) return;

    await updateBookingWithJobs.mutateAsync({
      id: booking.id,
      data: { status: targetStatus },
      completeJobs,
    });
    setCompletionDialogOpen(false);
    setTargetStatus(null);
  };

  const handleDeleteClick = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (jobToDelete) {
      await deleteJob.mutateAsync(jobToDelete);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleDeleteBookingConfirm = async () => {
    await deleteBooking.mutateAsync(id, {
      onSuccess: () => {
        setDeleteBookingDialogOpen(false);
        router.push("/bookings");
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Chi tiết đơn hàng" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer>
        <ContentSection title="Không tìm thấy">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-muted-foreground">Không tìm thấy đơn hàng</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const currentPrice = Number(booking.service.price);
  const capturedPrice = Number(booking.captured_price);
  const totalAmount = Number(booking.total_amount);
  const quantity = booking.quantity ? Number(booking.quantity) : null;
  const priceChanged = currentPrice !== capturedPrice;

  return (
    <PageContainer>
      <ContentSection
        title="Chi tiết đơn hàng"
        description={`Mã đơn: ${booking.id.slice(0, 8).toUpperCase()}`}
        actions={
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button 
                      variant="destructive" 
                      onClick={() => setDeleteBookingDialogOpen(true)}
                      disabled={!!booking.bill}
                      className={!!booking.bill ? "opacity-50 pointer-events-none" : ""}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </Button>
                  </span>
                </TooltipTrigger>
                {!!booking.bill && (
                  <TooltipContent>
                    <p>Đơn hàng đã có hóa đơn, không thể xóa</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant="outline"
              onClick={() => setEditBookingDialogOpen(true)}
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
          {/* Booking Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Column 1: Customer & Location */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Khách hàng</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-base text-primary hover:no-underline hover:text-primary/80"
                      onClick={() => router.push(`/customers/${booking.customer.id}`)}
                    >
                      {booking.customer.name}
                    </Button>
                    {booking.customer.phone && (
                      <p className="text-sm text-muted-foreground">
                        {booking.customer.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày tạo</p>
                    <p className="font-medium">
                      {formatDateShort(booking.created_at)}
                    </p>
                  </div>
                </div>

                  {/* Column 2: Service & pricing */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Dịch vụ</p>
                    <p className="font-medium">{booking.service.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thửa ruộng</p>
                    <p className="font-medium">
                      {booking.land?.name || <span className="text-muted-foreground">—</span>}
                    </p>
                  </div>
                </div>

                {/* Column 3: Status & Dates */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <div className="mt-1">
                      <StatusSelect
                        value={booking.status}
                        options={BOOKING_STATUS_OPTIONS}
                        onValueChange={handleStatusChange}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thanh toán</p>
                    <div className="mt-1">
                      <StatusBadge
                        variant={getPaymentStatusVariant(booking.payment_status)}
                        label={getPaymentStatusLabel(booking.payment_status)}
                      />
                    </div>
                  </div>

                </div>
              </div>

              {booking.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Ghi chú</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details Card - NEW */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-900">Chi tiết giá trị đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số lượng:</span>
                  <span className="font-medium">{Number(booking.quantity ?? 0)} {booking.service.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đơn giá:</span>
                  <span className="font-medium">{formatCurrency(Number(booking.captured_price))}</span>
                </div>
                
                {/* Adjustment */}
                {Number((booking as any).adjustment || 0) !== 0 && (
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Điều chỉnh:</span>
                    <span className={Number((booking as any).adjustment) > 0 ? "text-green-600" : "text-red-600"}>
                      {Number((booking as any).adjustment) > 0 ? "+" : "-"} {formatCurrency(Math.abs(Number((booking as any).adjustment)))}
                    </span>
                  </div>
                )}
                
                <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-semibold text-blue-900">Tổng giá trị:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Captured Price Explanation Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    Giá được ghi nhận: {formatCurrency(capturedPrice)}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Ngày tạo: {formatDateShort(booking.created_at)}
                  </p>
                  {priceChanged && (
                    <Alert className="mt-3 bg-amber-50 border-amber-200">
                      <AlertDescription className="text-xs text-amber-800">
                        Giá hiện tại của dịch vụ đã thay đổi thành{" "}
                        <strong>{formatCurrency(currentPrice)}</strong>, nhưng
                        đơn hàng này vẫn giữ nguyên giá{" "}
                        <strong>{formatCurrency(capturedPrice)}</strong> theo
                        thời điểm tạo đơn.
                      </AlertDescription>
                    </Alert>
                  )}
                  {!priceChanged && (
                    <p className="text-xs text-blue-600 mt-2">
                      Giá hiện tại của dịch vụ vẫn là{" "}
                      {formatCurrency(currentPrice)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs List Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Các công việc ({booking.jobs?.length || 0})</CardTitle>
              <Button
                size="sm"
                onClick={() => setCreateJobDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo công việc
              </Button>
            </CardHeader>
            <CardContent>
              {!booking.jobs || booking.jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có công việc nào cho đơn hàng này</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setCreateJobDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo công việc đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {booking.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/jobs/${job.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium">{job.job_type.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.worker.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusSelect
                            value={job.status}
                            options={JOB_STATUS_OPTIONS}
                            onValueChange={(value) => {
                            }}
                          />
                          {booking.status !== BookingStatus.Completed && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingJob(job);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteClick(job.id, e)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Số lượng: <span className="font-medium text-foreground">{Number(job.actual_qty)} {job.job_type.service.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bill Card (if billed) */}
          {booking.bill && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-900">Hóa đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Mã hóa đơn:</span>
                    <span className="font-medium text-green-900">
                      {booking.bill.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Tổng giá trị:</span>
                    <span className="font-medium text-green-900">
                      {formatCurrency(Number(booking.bill.total_amount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700">Đã thanh toán:</span>
                    <span className="font-medium text-green-900">
                      {formatCurrency(Number(booking.bill.total_paid))}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => router.push(`/bills/${booking.bill?.id}`)}
                  >
                    Xem chi tiết hóa đơn
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ContentSection>

      {/* Delete Job Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa công việc</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Booking Confirmation Dialog */}
      <Dialog open={deleteBookingDialogOpen} onOpenChange={setDeleteBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa đơn hàng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBookingDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBookingConfirm}
              disabled={deleteBooking.isPending}
            >
              {deleteBooking.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Complete Jobs Confirmation Dialog */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hoàn thành</DialogTitle>
            <DialogDescription>
              Đơn hàng này còn {incompleteJobCount} công việc chưa hoàn thành.
              Bạn có muốn tự động chuyển tất cả công việc sang trạng thái hoàn thành không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleConfirmCompletion(false)}
            >
              Không, chỉ cập nhật đơn hàng
            </Button>
            <Button onClick={() => handleConfirmCompletion(true)}>
              Có, hoàn thành tất cả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Create Job Dialog */}
      <CreateJobDialog
        open={createJobDialogOpen}
        onOpenChange={setCreateJobDialogOpen}
        booking={booking}
      />
      
      {editingJob && (
        <UpdateJobDialog
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          job={{
            ...editingJob,
            booking: booking,
            job_type: {
              ...editingJob.job_type,
              service: booking.service,
            },
          }}
        />
      )}

      <UpdateBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={booking}
      />
    </PageContainer>
  );
}
