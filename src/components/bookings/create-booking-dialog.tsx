"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useServices } from "@/hooks/use-services";
import { createBookingSchema } from "@/schemas/booking";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { QuantityInput } from "@/components/forms/quantity-input";
import { CurrencyInput } from "@/components/forms/currency-input";
import { formatCurrency } from "@/lib/format";
import { ChevronDown, Info } from "lucide-react";
import { z } from "zod";
import type { Customer, Land } from "@prisma/client";

// Customer with Lands
type CustomerWithLands = Customer & {
  lands: Land[];
};

type CreateBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerWithLands; // Customer is passed in, so we don't select it
  onSuccess?: (bookingId: string) => void;
};

type CreateBookingInput = z.infer<typeof createBookingSchema>;

export function CreateBookingDialog({ open, onOpenChange, customer, onSuccess }: CreateBookingDialogProps) {
  const createBooking = useCreateBooking();
  const { data: services, isLoading: servicesLoading } = useServices();

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema) as any,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      service_id: "",
      customer_id: customer.id, // Pre-filled
      land_id: "",
      quantity: undefined,
      adjustment: undefined,
      notes: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        service_id: "",
        customer_id: customer.id,
        land_id: "",
        quantity: undefined,
        adjustment: undefined,
        notes: "",
      });
    }
  }, [open, customer.id, form]);

  const selectedServiceId = form.watch("service_id");
  const quantity = form.watch("quantity");
  const adjustment = form.watch("adjustment");

  // Find selected service and get current price
  const selectedService = services?.find((s) => s.id === selectedServiceId);
  const currentPrice = selectedService ? Number(selectedService.price) : 0;

  // Calculate price preview
  const pricePreview = useMemo(() => {
    const qty = quantity || 0;
    const price = currentPrice;
    const adj = adjustment || 0;
    
    // Note: total amount is calculated on server, but we can preview it here
    const calculatedTotal = (qty * price) + adj;
    
    return {
      quantity: qty,
      price: price,
      adjustment: adj,
      total: calculatedTotal
    };
  }, [quantity, currentPrice, adjustment]); // removed captured_price dependency

  const onSubmit = async (data: CreateBookingInput) => {
    const payload = {
      ...data,
      land_id: data.land_id || undefined,
      quantity: data.quantity || undefined,
      adjustment: data.adjustment || 0,
    };

    const result = await createBooking.mutateAsync(payload);
    if (result.success && result.data?.id) {
      onOpenChange(false);
      onSuccess?.(result.data.id);
    }
  };

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
            {/* Service Select */}
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dịch vụ *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={servicesLoading ? "Đang tải dịch vụ..." : "Chọn dịch vụ"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} - {formatCurrency(Number(s.price))}/{s.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService && (
                    <FormDescription>
                      Giá hiện tại:{" "}
                      <strong className="text-primary">
                        {formatCurrency(currentPrice)}
                      </strong>{" "}
                      / {selectedService.unit}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Quantity Input */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng (tùy chọn)</FormLabel>
                  <FormControl>
                    <QuantityInput
                      value={field.value}
                      onChange={field.onChange}
                      unit={selectedService?.unit}
                      min={0}
                      step={1}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Preview Block */}
            {quantity !== undefined && quantity > 0 && selectedService && (
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
                          <span>{pricePreview.quantity} {selectedService.unit}</span>
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
            )}

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
  );
}
