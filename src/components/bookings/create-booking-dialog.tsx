"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCreateBooking } from "@/hooks/use-bookings"
import { createBookingSchema } from "@/schemas/booking"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuantityInput } from "@/components/forms/quantity-input"
import { z } from "zod"
import type { Customer, Land } from "@prisma/client"

type CustomerWithLands = Customer & {
  lands: Land[]
}

type CreateBookingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerWithLands
  onSuccess?: (bookingId: string) => void
}

type CreateBookingInput = z.infer<typeof createBookingSchema>

export function CreateBookingDialog({ open, onOpenChange, customer, onSuccess }: CreateBookingDialogProps) {
  const createBooking = useCreateBooking()

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      customer_id: customer.id,
      land_id: "",
      amount: undefined,
      notes: "",
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        customer_id: customer.id,
        land_id: "",
        amount: undefined,
        notes: "",
      })
    }
  }, [open, customer.id, form])

  const onSubmit = async (data: CreateBookingInput) => {
    const payload = {
      ...data,
      land_id: data.land_id || undefined,
      amount: data.amount || undefined,
    }

    const result = await createBooking.mutateAsync(payload)
    if (result.success && result.data?.id) {
      onOpenChange(false)
      onSuccess?.(result.data.id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đơn hàng mới</DialogTitle>
          <DialogDescription>
            Thêm đơn hàng cho khách hàng <strong>{customer.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Land Select */}
            <FormField
              control={form.control}
              name="land_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thửa ruộng (tùy chọn)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!customer.lands || customer.lands.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !customer.lands || customer.lands.length === 0
                              ? "Khách hàng chưa có ruộng"
                              : "Chọn thửa ruộng"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customer.lands?.map((land) => (
                        <SelectItem key={land.id} value={land.id}>
                          {land.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(!customer.lands || customer.lands.length === 0) && (
                    <FormDescription className="text-amber-600">
                      Khách hàng này chưa có thửa ruộng.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount Input */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lượng dự kiến (tùy chọn)</FormLabel>
                  <FormControl>
                    <QuantityInput
                      value={field.value}
                      onChange={field.onChange}
                      min={0}
                      step={1}
                    />
                  </FormControl>
                  <FormDescription>
                    Lượng công việc ước tính (mẫu, công, giờ, v.v.).
                  </FormDescription>
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
                      placeholder="Ghi chú về đơn hàng..."
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
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? "Đang tạo..." : "Tạo đơn hàng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
