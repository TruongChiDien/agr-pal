"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/hooks/use-bookings";
import { useDeleteJob } from "@/hooks/use-jobs";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ArrowLeft, Edit, Info, Plus, Trash2 } from "lucide-react";
import { BookingStatus, PaymentStatus } from "@/types/enums";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Map status enum to badge variant and label
function getBookingStatusVariant(
  status: string
): "new" | "in-progress" | "completed" | "blocked" | "canceled" {
  switch (status) {
    case BookingStatus.New:
      return "new";
    case BookingStatus.InProgress:
      return "in-progress";
    case BookingStatus.Completed:
      return "completed";
    case BookingStatus.Blocked:
      return "blocked";
    case BookingStatus.Canceled:
      return "canceled";
    default:
      return "new";
  }
}

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

function getBookingStatusLabel(status: string): string {
  switch (status) {
    case BookingStatus.New:
      return "Mới";
    case BookingStatus.InProgress:
      return "Đang xử lý";
    case BookingStatus.Completed:
      return "Hoàn thành";
    case BookingStatus.Blocked:
      return "Bị chặn";
    case BookingStatus.Canceled:
      return "Đã hủy";
    default:
      return status;
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
  const deleteJob = useDeleteJob();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

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
            <Button onClick={() => router.push("/bookings")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
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
            <Button
              variant="outline"
              onClick={() => router.push(`/bookings/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={() => router.push("/bookings")}>
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
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{booking.customer.name}</p>
                  {booking.customer.phone && (
                    <p className="text-sm text-muted-foreground">
                      {booking.customer.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thửa ruộng</p>
                  <p className="font-medium">
                    {booking.land?.name || <span className="text-muted-foreground">—</span>}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dịch vụ</p>
                  <p className="font-medium">{booking.service.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số lượng</p>
                  <p className="font-medium">
                    {quantity !== null ? (
                      <>
                        {quantity} {booking.service.unit}
                      </>
                    ) : (
                      <span className="text-amber-600">Chưa cập nhật</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <div className="mt-1">
                    <StatusBadge
                      variant={getBookingStatusVariant(booking.status)}
                      label={getBookingStatusLabel(booking.status)}
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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="font-medium">
                    {formatDateShort(booking.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng giá trị</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>

              {booking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Ghi chú</p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}
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
                onClick={() => router.push(`/jobs/new?booking_id=${booking.id}`)}
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
                    onClick={() => router.push(`/jobs/new?booking_id=${booking.id}`)}
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
                          <StatusBadge
                            variant={
                              job.status === "NEW"
                                ? "new"
                                : job.status === "IN_PROGRESS"
                                ? "in-progress"
                                : job.status === "COMPLETED"
                                ? "completed"
                                : job.status === "BLOCKED"
                                ? "blocked"
                                : "canceled"
                            }
                            label={
                              job.status === "NEW"
                                ? "Mới"
                                : job.status === "IN_PROGRESS"
                                ? "Đang xử lý"
                                : job.status === "COMPLETED"
                                ? "Hoàn thành"
                                : job.status === "BLOCKED"
                                ? "Bị chặn"
                                : "Đã hủy"
                            }
                          />
                          {booking.status !== BookingStatus.Completed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteClick(job.id, e)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
    </PageContainer>
  );
}
