"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUpdateBooking } from "@/hooks/use-bookings"
import { updateBookingSchema } from "@/schemas/booking"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { QuantityInput } from "@/components/forms/quantity-input"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import type { Booking } from "@prisma/client"
import { BookingStatus } from "@/types/enums"

// Define the shape of valid booking for update props
type BookingForUpdate = Booking

type UpdateBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingForUpdate
}

type UpdateBookingInput = z.infer<typeof updateBookingSchema>

export function UpdateBookingDialog({ open, onOpenChange, booking }: UpdateBookingDialogProps) {
  const updateBooking = useUpdateBooking()

  const form = useForm<UpdateBookingInput>({
    resolver: zodResolver(updateBookingSchema) as any,
    defaultValues: {
      status: booking.status as BookingStatus,
      notes: booking.notes || "",
      amount: booking.amount ? Number(booking.amount) : undefined,
    },
  })

  // Reset form when dialog opens or booking changes
  useEffect(() => {
    if (open && booking) {
      form.reset({
        status: booking.status as BookingStatus,
        notes: booking.notes || "",
        amount: booking.amount ? Number(booking.amount) : undefined,
      })
    }
  }, [open, booking, form])

  const onSubmit = async (data: UpdateBookingInput) => {
    const payload = {
      ...data,
      notes: data.notes || undefined,
      amount: data.amount || undefined,
    }

    const result = await updateBooking.mutateAsync({ id: booking.id, data: payload })
    if (result.success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật đơn hàng</DialogTitle>
          <DialogDescription>
            {booking.id.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Lượng dự kiến
                  </FormLabel>
                  <FormControl>
                    <QuantityInput
                      value={field.value}
                      onChange={field.onChange}
                      min={0}
                      step={1}
                      disabled={!!booking.bill_id}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú..."
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={updateBooking.isPending}
              >
                {updateBooking.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
