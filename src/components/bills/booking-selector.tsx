"use client"

import { useBookings } from "@/hooks/use-bookings"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { formatCurrency, formatDateShort } from "@/lib/format"
import { PaymentStatus } from "@/types/enums"
import type { Booking, Land } from "@prisma/client"

type BookingWithRelations = Booking & {
  land: Land | null
}

interface BookingSelectorProps {
  customerId: string
  selectedBookingIds: string[]
  onSelectionChange: (bookingIds: string[]) => void
  adjustment?: number
}

export function BookingSelector({
  customerId,
  selectedBookingIds,
  onSelectionChange,
  adjustment = 0,
}: BookingSelectorProps) {
  const { data: bookings, isLoading } = useBookings()

  // Filter: same customer, PENDING_BILL status
  const availableBookings = (bookings as BookingWithRelations[] | undefined)?.filter(
    (b) => b.customer_id === customerId && b.payment_status === PaymentStatus.PendingBill
  ) || []

  const totalAmount = availableBookings
    .filter((b) => selectedBookingIds.includes(b.id))
    .reduce((sum, b) => sum + Number(b.amount ?? 0), 0)

  const handleToggle = (bookingId: string) => {
    if (selectedBookingIds.includes(bookingId)) {
      onSelectionChange(selectedBookingIds.filter((id) => id !== bookingId))
    } else {
      onSelectionChange([...selectedBookingIds, bookingId])
    }
  }

  const handleSelectAll = () => {
    if (selectedBookingIds.length === availableBookings.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(availableBookings.map((b) => b.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-muted-foreground">Đang tải đơn hàng...</p>
      </div>
    )
  }

  if (availableBookings.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Không có đơn hàng chưa lập hóa đơn</AlertTitle>
        <AlertDescription>
          Khách hàng này chưa có đơn hàng nào cần lập hóa đơn.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Chọn đơn hàng ({selectedBookingIds.length}/{availableBookings.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleSelectAll}
        >
          {selectedBookingIds.length === availableBookings.length
            ? "Bỏ chọn tất cả"
            : "Chọn tất cả"}
        </Button>
      </div>

      <div className="border rounded-lg divide-y">
        {availableBookings.map((booking) => (
          <label
            key={booking.id}
            className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
          >
            <Checkbox
              checked={selectedBookingIds.includes(booking.id)}
              onCheckedChange={() => handleToggle(booking.id)}
            />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">
                  {booking.land?.name || "Chưa chọn ruộng"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(booking.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">
                  {booking.amount ? formatCurrency(Number(booking.amount)) : "—"}
                </p>
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Total Preview */}
      {selectedBookingIds.length > 0 && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Tổng tiền hàng:
                </span>
                <span className="text-lg font-semibold">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {adjustment !== 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Điều chỉnh:
                    </span>
                    <span className={`text-lg font-semibold ${adjustment > 0 ? "text-green-600" : "text-destructive"}`}>
                      {adjustment > 0 ? "+" : ""} {formatCurrency(adjustment)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Thành tiền:
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(totalAmount + adjustment)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {adjustment === 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Thành tiền:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedBookingIds.length} đơn hàng được chọn
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
