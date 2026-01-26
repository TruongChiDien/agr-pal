"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAdvancePayment, useUpdateAdvancePayment } from "@/hooks/use-advances";
import { createAdvancePaymentSchema, updateAdvancePaymentSchema } from "@/schemas/worker";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/forms/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { z } from "zod";

type AdvancePaymentDialogProps = {
  open: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
  initialData?: {
    id: string;
    amount: number | string; // Prisma Decimal to string/number
    notes?: string | null;
    payroll_id?: string | null;
  };
};

type FormInput = z.infer<typeof createAdvancePaymentSchema>;

export function AdvancePaymentDialog({
  open,
  onClose,
  workerId,
  workerName,
  initialData,
}: AdvancePaymentDialogProps) {
  const createAdvance = useCreateAdvancePayment();
  const updateAdvance = useUpdateAdvancePayment();

  const isEditing = !!initialData;
  // If editing and payroll_id exists, disable amount editing
  const isAmountDisabled = isEditing && !!initialData?.payroll_id;

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateAdvancePaymentSchema : createAdvancePaymentSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      worker_id: workerId,
      amount: 0,
      notes: "",
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
            worker_id: workerId,
            amount: Number(initialData.amount),
            notes: initialData.notes || "",
        });
      } else {
        form.reset({
            worker_id: workerId,
            amount: 0,
            notes: "",
        });
      }
    }
  }, [open, workerId, initialData, form]);

  const onSubmit = async (data: FormInput) => {
    if (isEditing && initialData) {
        await updateAdvance.mutateAsync({ id: initialData.id, data }, {
            onSuccess: onClose,
        });
    } else {
        await createAdvance.mutateAsync(data, {
            onSuccess: onClose,
        });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? (isAmountDisabled ? "Cập nhật ghi chú" : "Cập nhật tạm ứng")
              : "Tạo tạm ứng"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? (isAmountDisabled 
                  ? `Cập nhật ghi chú cho khoản tạm ứng của ${workerName}`
                  : `Cập nhật thông tin tạm ứng của công nhân ${workerName}`)
              : `Tạo khoản tạm ứng mới cho công nhân ${workerName}`}
            {isAmountDisabled && <p className="text-destructive mt-1 text-sm font-medium">Khoản tạm ứng đã có trong phiếu lương nên không thể thay đổi số tiền.</p>}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount Input */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền *</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isAmountDisabled}
                    />
                  </FormControl>
                  <FormDescription>
                    Nhập số tiền tạm ứng cho công nhân
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Input */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ghi chú về khoản tạm ứng..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createAdvance.isPending || updateAdvance.isPending}
              >
                {createAdvance.isPending || updateAdvance.isPending ? "Đang xử lý..." : (isEditing ? "Lưu thay đổi" : "Tạo tạm ứng")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
