"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useBooking, useDeleteBooking, useUpdateBooking } from "@/hooks/use-bookings"
import { PageContainer, ContentSection } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/status/status-badge"
import { StatusSelect } from "@/components/status/status-select"
import { formatCurrency, formatDateShort } from "@/lib/format"

import { ArrowLeft, Edit, Plus, Trash2, CalendarDays, Tractor } from "lucide-react"
import { BookingStatus, PaymentStatus } from "@/types/enums"
import { UpdateBookingDialog } from "@/components/bookings/update-booking-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const BOOKING_STATUS_OPTIONS = [
  { value: BookingStatus.New, label: "Mới", variant: "new" as const },
  { value: BookingStatus.InProgress, label: "Đang xử lý", variant: "in-progress" as const },
  { value: BookingStatus.Completed, label: "Hoàn thành", variant: "completed" as const },
  { value: BookingStatus.Blocked, label: "Bị chặn", variant: "blocked" as const },
  { value: BookingStatus.Canceled, label: "Đã hủy", variant: "canceled" as const },
]

function getPaymentStatusVariant(status: string): "pending" | "partial" | "paid" {
  switch (status) {
    case PaymentStatus.PendingBill: return "pending"
    case PaymentStatus.AddedBill: return "partial"
    case PaymentStatus.FullyPaid: return "paid"
    default: return "pending"
  }
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case PaymentStatus.PendingBill: return "Chưa tạo HĐ"
    case PaymentStatus.AddedBill: return "Đã tạo HĐ"
    case PaymentStatus.FullyPaid: return "Đã thanh toán"
    default: return status
  }
}

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const { data: booking, isLoading } = useBooking(id)
  const updateBooking = useUpdateBooking()
  const deleteBooking = useDeleteBooking()

  const [deleteBookingDialogOpen, setDeleteBookingDialogOpen] = useState(false)
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return
    await updateBooking.mutateAsync({
      id: booking.id,
      data: { status: newStatus as BookingStatus },
    })
  }

  const handleDeleteBookingConfirm = async () => {
    await deleteBooking.mutateAsync(id, {
      onSuccess: () => {
        setDeleteBookingDialogOpen(false)
        router.push("/bookings")
      },
    })
  }

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Chi tiết đơn hàng" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    )
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
    )
  }

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
              disabled={!!booking.bill}
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
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày tạo</p>
                    <p className="font-medium">
                      {formatDateShort(booking.created_at)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Thửa ruộng</p>
                    <p className="font-medium">
                      {booking.land?.name || <span className="text-muted-foreground">—</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lượng dự kiến (amount)</p>
                    <p className="font-medium">
                      {booking.amount ? formatCurrency(Number(booking.amount)) : "—"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <div className="mt-1">
                      <StatusSelect
                        value={booking.status}
                        options={BOOKING_STATUS_OPTIONS}
                        onValueChange={handleStatusChange}
                        disabled={!!booking.bill}
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

          {/* Daily Bookings List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Lịch sử ngày làm việc
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booking.daily_bookings?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa có ngày làm việc nào ghi nhận cho đơn hàng này
                </p>
              ) : (
                <div className="space-y-3">
                  {booking.daily_bookings?.map((db: any) => (
                    <div key={db.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold cursor-pointer" onClick={() => router.push(`/work-days/${db.work_day.id}`)}>
                          {formatDateShort(db.work_day.date)}
                        </span>
                        <span className="font-medium">
                          {db.amount ? formatCurrency(Number(db.amount)) : "—"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                        <Tractor className="h-4 w-4 mr-1" />
                        {db.machines && db.machines.length > 0 ? (
                          db.machines.map((m: any) => (
                            <span key={m.id} className="bg-secondary px-2 py-1 rounded">
                              {m.daily_machine.machine.name}
                            </span>
                          ))
                        ) : (
                          <span>Chưa gán máy</span>
                        )}
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

      <UpdateBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={booking}
      />
    </PageContainer>
  )
}
