"use client";

import { useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useBill, useAddBillPayment } from "@/hooks/use-bills";
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
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBillPaymentSchema } from "@/schemas/payment";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AddBillPaymentInput = z.infer<typeof addBillPaymentSchema>;

export default function AddBillPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const billId = params.id as string;
  const { data: bill, isLoading } = useBill(billId);
  const addPayment = useAddBillPayment();
  const { toast } = useToast();

  const [paymentDate, setPaymentDate] = useState<Date>(new Date());

  const form = useForm<AddBillPaymentInput>({
    resolver: zodResolver(addBillPaymentSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      bill_id: billId,
      amount: 0,
      payment_date: new Date(),
      method: "CASH",
      notes: "",
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Thêm thanh toán" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!bill) {
    return (
      <PageContainer>
        <ContentSection title="Thêm thanh toán" description="Hóa đơn không tồn tại">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>Không tìm thấy hóa đơn</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const totalAmount = Number(bill.total_amount);
  const totalPaid = Number(bill.total_paid);
  const remainingBalance = totalAmount - totalPaid;

  const onSubmit = async (data: AddBillPaymentInput) => {
    if (data.amount > remainingBalance) {
      toast({
        title: "Lỗi",
        description: `Số tiền thanh toán (${formatCurrency(data.amount)}) vượt quá số tiền còn lại (${formatCurrency(remainingBalance)})`,
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        bill_id: billId,
        amount: data.amount,
        payment_date: paymentDate,
        method: data.method,
        notes: data.notes,
      };

      const result = await addPayment.mutateAsync(payload);

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Đã thêm thanh toán",
        });
        // Redirect to specified path or default to bill detail page
        router.push(redirectTo || `/bills/${billId}`);
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể thêm thanh toán",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi thêm thanh toán",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer>
      <ContentSection
        title="Thêm thanh toán"
        description={`Hóa đơn #${bill.id.slice(0, 8)}`}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        {/* Bill Summary */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tổng hóa đơn</p>
                <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đã thanh toán</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Còn lại</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(remainingBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {remainingBalance <= 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Thông báo</AlertTitle>
            <AlertDescription>Hóa đơn đã được thanh toán đầy đủ</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
              {/* Amount Input */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Số tiền thanh toán *</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.onChange(remainingBalance)}
                        className="h-7 text-xs"
                      >
                        Trả hết
                      </Button>
                    </div>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        min={0}
                        max={remainingBalance}
                        incrementStep={10000}
                        placeholder="Nhập số tiền thanh toán"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Số tiền tối đa: {formatCurrency(remainingBalance)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày thanh toán *</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        value={paymentDate.toISOString().split("T")[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value);
                          setPaymentDate(newDate);
                          field.onChange(newDate);
                        }}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phương thức thanh toán *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phương thức" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASH">Tiền mặt</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                      </SelectContent>
                    </Select>
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
                        placeholder="Ghi chú về thanh toán (tùy chọn)"
                        className="resize-none"
                        {...field}
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
                  disabled={form.watch("amount") <= 0 || addPayment.isPending}
                  className="min-w-[120px]"
                >
                  {addPayment.isPending ? "Đang xử lý..." : "Thêm thanh toán"}
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
        )}
      </ContentSection>
    </PageContainer>
  );
}
