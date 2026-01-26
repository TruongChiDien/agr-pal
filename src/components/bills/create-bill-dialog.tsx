"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateBill } from "@/hooks/use-bills";
import { createBillSchema } from "@/schemas/bill";
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
import { z } from "zod";
import { BookingSelector } from "@/components/bills/booking-selector";

type CreateBillDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
};

type CreateBillInput = z.infer<typeof createBillSchema>;

export function CreateBillDialog({ open, onOpenChange, customerId }: CreateBillDialogProps) {
  const createBill = useCreateBill();

  const form = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      customer_id: customerId,
      booking_ids: [],
      adjustment: 0,
      notes: "",
    },
  });

  const onSubmit = async (data: CreateBillInput) => {
    // If backend expects adjustment
    const result = await createBill.mutateAsync(data);
    if (result.success) {
      form.reset({
        customer_id: customerId,
        booking_ids: [],
        adjustment: 0,
        notes: "",
      });
      onOpenChange(false);
    }
  };

  const adjustment = useWatch({ control: form.control, name: "adjustment" }) || 0;
  const selectedBookingIds = useWatch({ control: form.control, name: "booking_ids" }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn mới</DialogTitle>
          <DialogDescription>
            Chọn các đơn hàng cần thanh toán để tạo hóa đơn.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...form.register("customer_id")} value={customerId} />

            <BookingSelector
              customerId={customerId}
              selectedBookingIds={selectedBookingIds}
              onSelectionChange={(ids) => form.setValue("booking_ids", ids)}
              adjustment={adjustment}
            />

            {selectedBookingIds.length > 0 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="adjustment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tiền điều chỉnh (+/-)</FormLabel>
                      <FormControl>
                        <div className="relative">
                           {/* Assuming CurrencyInput can handle negative if min is negative */}
                           {/* But CreateBillDialog used Input type=number before. I should use correct component. */}
                           {/* Previous code used Input type=number. I should allow negative. */}
                           {/* Using Input type=number allows minus sign. */}
                           <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                 const val = e.target.value;
                                 field.onChange(val === "" ? 0 : Number(val));
                              }}
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ghi chú thêm..." 
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
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createBill.isPending || selectedBookingIds.length === 0}>
                {createBill.isPending ? "Đang tạo..." : "Tạo hóa đơn"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
