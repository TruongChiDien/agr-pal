"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useCustomers } from "@/hooks/use-customers";
import { useServices } from "@/hooks/use-services";
import { createBookingSchema } from "@/schemas/booking";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ArrowLeft, ChevronDown, Info } from "lucide-react";
import { z } from "zod";

type CreateBookingInput = z.infer<typeof createBookingSchema>;

export default function CreateBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const customerIdFromUrl = searchParams.get("customer_id");
  const createBooking = useCreateBooking();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: services, isLoading: servicesLoading } = useServices();

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      service_id: "",
      customer_id: customerIdFromUrl || "",
      land_id: "",
      quantity: 0,
      captured_price: undefined,
      notes: "",
    },
  });

  const selectedServiceId = form.watch("service_id");
  const selectedCustomerId = form.watch("customer_id");
  const quantity = form.watch("quantity");
  const capturedPriceOverride = form.watch("captured_price");

  // Find selected service and get current price
  const selectedService = services?.find((s) => s.id === selectedServiceId);
  const currentPrice = selectedService ? Number(selectedService.price) : 0;

  // Find selected customer and their lands
  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);
  const customerLands = selectedCustomer?.lands || [];

  // Determine captured price (override or current price, default to 0 if no override and currentPrice is 0)
  const capturedPrice = capturedPriceOverride !== undefined ? capturedPriceOverride : currentPrice;

  // Auto-calculate total amount
  const totalAmount = (quantity || 0) * capturedPrice;

  // Reset land selection when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      form.setValue("land_id", "");
    }
  }, [selectedCustomerId, form]);

  // Reset captured_price override when service changes to apply new default price
  useEffect(() => {
    if (selectedServiceId && capturedPriceOverride !== undefined) {
      // Only reset if user hasn't explicitly set a custom price different from previous service
      form.setValue("captured_price", undefined);
    }
  }, [selectedServiceId]);

  const onSubmit = async (data: CreateBookingInput) => {
    // Clean up empty optional fields
    const payload = {
      ...data,
      land_id: data.land_id || undefined,
      quantity: data.quantity || undefined,
    };

    const result = await createBooking.mutateAsync(payload);
    if (result.success && result.data?.id) {
      // Redirect to specified path or default to booking detail page
      router.push(redirectTo || `/bookings/${result.data.id}`);
    }
  };

  const isLoading = customersLoading || servicesLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Tạo đơn hàng mới" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Tạo đơn hàng mới"
        description="Thêm đơn hàng dịch vụ cho khách hàng"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            {/* Service Select (FIRST) */}
            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dịch vụ *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dịch vụ" />
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

            {/* Customer Select (SECOND) */}
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khách hàng *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.phone && `(${c.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Land Select (THIRD - Optional) */}
            <FormField
              control={form.control}
              name="land_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thửa ruộng (tùy chọn)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCustomerId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !selectedCustomerId
                              ? "Chọn khách hàng trước"
                              : customerLands.length === 0
                              ? "Khách hàng chưa có ruộng"
                              : "Chọn thửa ruộng"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customerLands.map((land) => (
                        <SelectItem key={land.id} value={land.id}>
                          {land.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCustomerId && customerLands.length === 0 && (
                    <FormDescription className="text-amber-600">
                      Khách hàng này chưa có thửa ruộng. Có thể bỏ qua hoặc thêm ruộng sau.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity Input (FOURTH - Optional) */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng (tùy chọn)</FormLabel>
                  <FormControl>
                    <QuantityInput
                      value={field.value || 0}
                      onChange={field.onChange}
                      unit={selectedService?.unit}
                      min={0}
                      step={1}
                    />
                  </FormControl>
                  <FormDescription>
                    Có thể cập nhật số lượng sau khi tạo đơn hàng
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Amount Preview */}
            {quantity && quantity > 0 && selectedService && (
              <Card className="bg-muted/50 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Tổng giá trị:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {quantity} {selectedService.unit} × {formatCurrency(capturedPrice)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Advanced: Price Override (Collapsible) */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="link" size="sm" type="button" className="px-0">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Tùy chỉnh giá (nâng cao)
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="captured_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá áp dụng</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CurrencyInput
                            value={field.value !== undefined ? field.value : currentPrice}
                            onChange={(value) => {
                              // If user clears or sets to 0, reset to undefined to use default
                              if (value === 0 || value === currentPrice) {
                                field.onChange(undefined);
                              } else {
                                field.onChange(value);
                              }
                            }}
                            min={0}
                          />
                          {field.value !== undefined && field.value !== currentPrice && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-12 top-1/2 -translate-y-1/2"
                              onClick={() => field.onChange(undefined)}
                            >
                              Đặt lại
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Giá mặc định: {formatCurrency(currentPrice)}.
                        Chỉ tùy chỉnh nếu có thỏa thuận đặc biệt với khách hàng.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {capturedPriceOverride !== undefined && capturedPriceOverride !== currentPrice && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Giá đã được tùy chỉnh từ {formatCurrency(currentPrice)} thành{" "}
                      {formatCurrency(capturedPriceOverride)}. Giá này sẽ được lưu vào đơn hàng.
                    </AlertDescription>
                  </Alert>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Notes (Optional) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú về đơn hàng (nếu có)"
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

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createBooking.isPending}
                className="min-w-[120px]"
              >
                {createBooking.isPending ? "Đang tạo..." : "Tạo đơn hàng"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Form>
      </ContentSection>
    </PageContainer>
  );
}
