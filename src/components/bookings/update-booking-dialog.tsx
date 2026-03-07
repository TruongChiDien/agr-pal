"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateBooking } from "@/hooks/use-bookings";
import { updateBookingSchema } from "@/schemas/booking";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { QuantityInput } from "@/components/forms/quantity-input";
import { CurrencyInput } from "@/components/forms/currency-input";

import { formatCurrency } from "@/lib/format";
import { ChevronDown, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { z } from "zod";
import type { Booking, Service } from "@prisma/client";
import { BookingStatus } from "@/types/enums";

// Define the shape of valid booking for update props
type BookingForUpdate = Booking & {
  service: Service;
};

type UpdateBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingForUpdate;
};

type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export function UpdateBookingDialog({ open, onOpenChange, booking }: UpdateBookingDialogProps) {
  const updateBooking = useUpdateBooking();

  const form = useForm<UpdateBookingInput>({
    resolver: zodResolver(updateBookingSchema) as any,
    defaultValues: {
      status: booking.status as BookingStatus,
      notes: booking.notes || "",
      quantity: Number(booking.quantity),
      captured_price: Number(booking.captured_price),
      adjustment: Number((booking as any).adjustment || 0),
    },
  });

  // Reset form when dialog opens or booking changes
  useEffect(() => {
    if (open && booking) {
      form.reset({
        status: booking.status as BookingStatus,
        notes: booking.notes || "",
        quantity: Number(booking.quantity),
        captured_price: Number(booking.captured_price),
        adjustment: Number((booking as any).adjustment || 0),
      });
    }
  }, [open, booking, form]);

  const quantity = form.watch("quantity");
  const adjustment = form.watch("adjustment");
  const capturedPrice = form.watch("captured_price");

  const pricePreview = useMemo(() => {
    const qty = quantity || 0;
    const price = capturedPrice || 0;
    const adj = adjustment || 0;
    
    // Note: total amount is calculated on server, but we can preview it here
    const calculatedTotal = (qty * price) + adj;
    
    return {
      quantity: qty,
      price: price,
      adjustment: adj,
      total: calculatedTotal
    };
  }, [quantity, adjustment, capturedPrice]);

  const onSubmit = async (data: UpdateBookingInput) => {
    const payload = {
      ...data,
      notes: data.notes || undefined,
    };

    const result = await updateBooking.mutateAsync({ id: booking.id, data: payload });
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật đơn hàng</DialogTitle>
          <DialogDescription>
            {booking.id.slice(0, 8).toUpperCase()} - {booking.service.name}
          </DialogDescription>
        </DialogHeader>
        
        {/* Warning if booking has bill */}
        {!!booking.bill_id && (
          <Alert className="bg-amber-50 border-amber-200 mb-6">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Đơn hàng này đã được thêm vào hóa đơn. Bạn không thể thay đổi số lượng và điều chỉnh giá trị.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Số lượng ({booking.service.unit})
                  </FormLabel>
                  <FormControl>
                    <QuantityInput
                      value={field.value}
                      onChange={field.onChange}
                      unit={booking.service.unit}
                      min={0}
                      step={1}
                      disabled={!!booking.bill_id}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Preview Block */}
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900">
                      Chi tiết giá trị:
                    </p>
                    <div className="font-mono text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số lượng:</span>
                        <span>{pricePreview.quantity} {booking.service.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Đơn giá:</span>
                        <span>{formatCurrency(pricePreview.price)}</span>
                      </div>
                      
                      {pricePreview.adjustment !== 0 && (
                        <div className="flex justify-between font-medium">
                          <span className="text-muted-foreground">Điều chỉnh:</span>
                          <span className={pricePreview.adjustment > 0 ? "text-green-600" : "text-red-600"}>
                            {pricePreview.adjustment > 0 ? "+" : "-"} {formatCurrency(Math.abs(pricePreview.adjustment))}
                          </span>
                        </div>
                      )}
                      
                      <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                        <span className="font-semibold text-blue-900">Tổng giá trị:</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(pricePreview.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adjustment */}
              <FormField
                control={form.control}
                name="adjustment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tiền điều chỉnh (Thưởng / Phạt)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          min={-1000000000} // Allow negative
                          disabled={!!booking.bill_id}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Nhập số dương để tăng, số âm để giảm giá trị đơn hàng.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
  );
}
