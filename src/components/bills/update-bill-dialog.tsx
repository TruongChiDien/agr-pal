"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateBill } from "@/hooks/use-bills";
import { updateBillSchema } from "@/schemas/bill";
import { useBookings } from "@/hooks/use-bookings";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
import type { Bill, Booking, Land, Service } from "@prisma/client";
import { BillStatus, PaymentStatus } from "@/types/enums";
import { formatDateShort, formatCurrency } from "@/lib/format";

type UpdateBillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill & { bookings: Booking[] };
};

type UpdateBillInput = z.infer<typeof updateBillSchema>;

type BookingWithRelations = Booking & {
  land: Land | null;
  service: Service;
};

export function UpdateBillDialog({ open, onOpenChange, bill }: UpdateBillDialogProps) {
  const updateBill = useUpdateBill();
  const { data: bookings } = useBookings();
  
  // Check if bill is editable (status OPEN and not paid)
  // Need to verify 'total_paid' from bill. However, simple Prisma type might keep it as Decimal.
  // We assume the passed bill object has Decimal or number fields.
  const isEditable = bill.status === BillStatus.Open && Number(bill.total_paid) === 0;

  const form = useForm<UpdateBillInput>({
    resolver: zodResolver(updateBillSchema),
    defaultValues: {
      booking_ids: bill.bookings.map(b => b.id),
      adjustment: Number((bill as any).adjustment ?? 0) || undefined,
      notes: (bill as any).notes || "",
    },
  });

  // Sync form when bill changes
  useEffect(() => {
    if (open && bill) {
      form.reset({
        booking_ids: bill.bookings.map(b => b.id),
        adjustment: Number((bill as any).adjustment ?? 0) || undefined,
        notes: (bill as any).notes || "",
      });
    }
  }, [open, bill, form]);

  const onSubmit = async (data: UpdateBillInput) => {
    const result = await updateBill.mutateAsync({ id: bill.id, data });
    if (result.success) {
      onOpenChange(false);
    }
  };

  const selectedBookingIds = useWatch({ control: form.control, name: "booking_ids" }) || [];
  const adjustment = useWatch({ control: form.control, name: "adjustment" }) || 0;

  // Prepare bookings list for selection
  // Includes: 
  // 1. Current bookings in the bill
  // 2. Available PENDING bookings for this customer
  const allRelevantBookings = bookings 
      ? (bookings as BookingWithRelations[]).filter(b => 
          // Match customer
          b.customer_id === bill.customer_id && 
          (
            // Either already in this bill
            b.bill_id === bill.id ||
            // Or pending bill
            b.payment_status === PaymentStatus.PendingBill
          )
      ) 
      : [];

  const totalAmount = allRelevantBookings
    .filter((b) => selectedBookingIds.includes(b.id))
    .reduce((sum, b) => sum + Number(b.total_amount), 0);
  
  const handleToggle = (bookingId: string) => {
      const current = selectedBookingIds;
      if (current.includes(bookingId)) {
        form.setValue("booking_ids", current.filter((id) => id !== bookingId));
      } else {
        form.setValue("booking_ids", [...current, bookingId]);
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật hóa đơn</DialogTitle>
          <DialogDescription>
            {isEditable 
              ? "Cập nhật thông tin hóa đơn. Bạn có thể thêm/bớt đơn hàng khi hóa đơn chưa thanh toán." 
              : "Hóa đơn đã thanh toán một phần hoặc hoàn tất. Chỉ có thể cập nhật ghi chú."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Danh sách đơn hàng</h3>
                </div>
                
                <div className={`border rounded-lg divide-y max-h-[300px] overflow-y-auto ${!isEditable ? 'opacity-70 pointer-events-none bg-muted/20' : ''}`}>
                  {allRelevantBookings.map((booking) => (
                    <label
                      key={booking.id}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedBookingIds.includes(booking.id)}
                        onCheckedChange={() => handleToggle(booking.id)}
                        disabled={!isEditable}
                      />
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {booking.land?.name || "Chưa chọn ruộng"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(booking.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">{booking.service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(booking.quantity)} {booking.service.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(Number(booking.total_amount))}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                  {allRelevantBookings.length === 0 && (
                     <div className="p-4 text-center text-sm text-muted-foreground">Không có đơn hàng nào khả dụng</div>
                   )}
                </div>

                <Card className="bg-muted/50 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tổng tiền hàng:</span>
                        <span className="text-lg font-semibold">{formatCurrency(totalAmount)}</span>
                      </div>

                      {adjustment !== 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Điều chỉnh:</span>
                          <span className={`text-lg font-semibold ${adjustment > 0 ? "text-green-600" : "text-orange-600"}`}>
                             {adjustment > 0 ? "+" : ""} {formatCurrency(adjustment)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t mt-1">
                         <span className="text-sm font-medium">Thành tiền dự kiến:</span>
                         <span className="text-2xl font-bold text-primary">
                           {formatCurrency(totalAmount + adjustment)}
                         </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="adjustment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tiền điều chỉnh (+/-)</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              value={field.value || ""} 
                              onChange={(e) => {
                                 const val = e.target.value;
                                 field.onChange(val === "" ? 0 : Number(val));
                              }}
                              disabled={!isEditable}
                            />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Số dương để cộng thêm, số âm để giảm trừ.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ghi chú hóa đơn..." 
                      className="resize-none"
                      rows={3}
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
              <Button type="submit" disabled={updateBill.isPending || (isEditable && selectedBookingIds.length === 0)}>
                {updateBill.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
