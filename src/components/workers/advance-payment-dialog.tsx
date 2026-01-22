"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAdvancePayment } from "@/hooks/use-workers";
import { createAdvancePaymentSchema } from "@/schemas/worker";
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
};

type CreateAdvancePaymentInput = z.infer<typeof createAdvancePaymentSchema>;

export function AdvancePaymentDialog({
  open,
  onClose,
  workerId,
  workerName,
}: AdvancePaymentDialogProps) {
  const createAdvance = useCreateAdvancePayment();

  const form = useForm<CreateAdvancePaymentInput>({
    resolver: zodResolver(createAdvancePaymentSchema),
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
      form.reset({
        worker_id: workerId,
        amount: 0,
        notes: "",
      });
    }
  }, [open, workerId, form]);

  const onSubmit = async (data: CreateAdvancePaymentInput) => {
    await createAdvance.mutateAsync(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo tạm ứng</DialogTitle>
          <DialogDescription>
            Tạo khoản tạm ứng mới cho công nhân {workerName}
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
                disabled={createAdvance.isPending}
              >
                {createAdvance.isPending ? "Đang tạo..." : "Tạo tạm ứng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
