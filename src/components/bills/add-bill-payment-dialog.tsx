"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddBillPayment } from "@/hooks/use-bills";
import { addBillPaymentSchema } from "@/schemas/payment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/forms/currency-input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { z } from "zod";
import type { Bill } from "@prisma/client";

type AddBillPaymentInput = z.infer<typeof addBillPaymentSchema>;

interface AddBillPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill;
}

export function AddBillPaymentDialog({ open, onOpenChange, bill }: AddBillPaymentDialogProps) {
  const addPayment = useAddBillPayment();
  const { toast } = useToast();
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());

  const form = useForm<AddBillPaymentInput>({
    resolver: zodResolver(addBillPaymentSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      bill_id: bill.id,
      amount: 0,
      payment_date: new Date(),
      method: "CASH",
      notes: "",
    },
  });

  // Reset form when dialog opens or bill changes
  useEffect(() => {
    if (open) {
        setPaymentDate(new Date());
        form.reset({
            bill_id: bill.id,
            amount: 0,
            payment_date: new Date(),
            method: "CASH",
            notes: "",
        });
    }
  }, [open, bill.id, form]);


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
        bill_id: bill.id,
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
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm thanh toán</DialogTitle>
          <DialogDescription>
            Hóa đơn #{bill.id.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>

        {/* Bill Summary */}
        <Card className="mb-4 bg-muted/50 border-none shadow-none">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Tổng hóa đơn</p>
                <p className="font-semibold">{formatCurrency(totalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đã thanh toán</p>
                <p className="font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Còn lại</p>
                <p className="font-bold text-destructive">{formatCurrency(remainingBalance)}</p>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        className="h-6 text-xs px-2"
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

              <div className="grid grid-cols-2 gap-4">
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
                                const val = e.target.value;
                                if (val) {
                                    const newDate = new Date(val);
                                    setPaymentDate(newDate);
                                    field.onChange(newDate);
                                }
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
                        <FormLabel>Phương thức *</FormLabel>
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
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={form.watch("amount") <= 0 || addPayment.isPending}
                >
                  {addPayment.isPending ? "Đang xử lý..." : "Thêm thanh toán"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
