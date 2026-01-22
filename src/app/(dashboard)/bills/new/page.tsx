"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateBill } from "@/hooks/use-bills";
import { useCustomers } from "@/hooks/use-customers";
import { BookingSelector } from "@/components/bills/booking-selector";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/forms/currency-input";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBillSchema } from "@/schemas/bill";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type CreateBillInput = z.infer<typeof createBillSchema>;

export default function CreateBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const customerIdFromUrl = searchParams.get("customer_id");
  const createBill = useCreateBill();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { toast } = useToast();

  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);

  const form = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      customer_id: customerIdFromUrl || "",
      booking_ids: [],
      discount_amount: 0,
      discount_reason: "",
    },
  });

  const selectedCustomerId = form.watch("customer_id");

  // Sync selectedBookingIds with form field
  useEffect(() => {
    form.setValue("booking_ids", selectedBookingIds);
  }, [selectedBookingIds, form]);

  const onSubmit = async (data: CreateBillInput) => {
    console.log("Form submitted with data:", data);
    console.log("Selected booking IDs:", selectedBookingIds);

    if (selectedBookingIds.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất 1 đơn hàng",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        customer_id: data.customer_id,
        booking_ids: selectedBookingIds,
        discount_amount: data.discount_amount || 0,
        discount_reason: data.discount_reason,
      };

      console.log("Calling createBill with payload:", payload);

      const result = await createBill.mutateAsync(payload);

      console.log("Result from createBill:", result);

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Hóa đơn đã được tạo thành công",
        });
        // Redirect to specified path or default to bill detail page
        router.push(redirectTo || `/bills/${result.data.id}`);
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể tạo hóa đơn",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating bill:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo hóa đơn",
        variant: "destructive",
      });
    }
  };

  if (customersLoading) {
    return (
      <PageContainer>
        <ContentSection title="Tạo hóa đơn mới" description="Đang tải...">
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
        title="Tạo hóa đơn mới"
        description="Lập hóa đơn từ các đơn hàng đã hoàn thành"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
            {/* Customer Select */}
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khách hàng *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset selected bookings when customer changes
                      setSelectedBookingIds([]);
                    }}
                    value={field.value}
                  >
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

            {/* Booking Multi-Select */}
            {selectedCustomerId && (
              <BookingSelector
                customerId={selectedCustomerId}
                selectedBookingIds={selectedBookingIds}
                onSelectionChange={setSelectedBookingIds}
                discountAmount={form.watch("discount_amount") || 0}
              />
            )}

            {/* Discount Amount */}
            {selectedBookingIds.length > 0 && (
              <>
                <FormField
                  control={form.control}
                  name="discount_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giảm giá (tùy chọn)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          min={0}
                          incrementStep={10000}
                          placeholder="Nhập số tiền giảm giá"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Discount Reason */}
                {form.watch("discount_amount") > 0 && (
                  <FormField
                    control={form.control}
                    name="discount_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lý do giảm giá</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nhập lý do giảm giá (tùy chọn)"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={selectedBookingIds.length === 0 || createBill.isPending}
                className="min-w-[120px]"
              >
                {createBill.isPending ? "Đang tạo..." : "Tạo hóa đơn"}
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
