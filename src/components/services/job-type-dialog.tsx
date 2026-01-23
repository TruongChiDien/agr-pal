"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateJobType, useUpdateJobType } from "@/hooks/use-job-types";
import { createJobTypeSchema } from "@/schemas/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/form";
import { CurrencyInput } from "@/components/forms/currency-input";
import type { z } from "zod";
import type { Job_Type } from "@prisma/client";

type JobTypeDialogProps = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  initialData?: Job_Type;
};

type CreateJobTypeInput = z.infer<typeof createJobTypeSchema>;

export function JobTypeDialog({
  open,
  onClose,
  serviceId,
  initialData,
}: JobTypeDialogProps) {
  const createJobType = useCreateJobType();
  const updateJobType = useUpdateJobType();

  const form = useForm<CreateJobTypeInput>({
    resolver: zodResolver(createJobTypeSchema),
    defaultValues: {
      service_id: serviceId,
      name: "",
      default_base_salary: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        service_id: serviceId,
        name: initialData?.name || "",
        default_base_salary: initialData?.default_base_salary
          ? Number(initialData.default_base_salary) // Prisma base salary is Decimal, cast to number
          : 0,
      });
    }
  }, [open, initialData, serviceId, form]);

  const onSubmit = async (data: CreateJobTypeInput) => {
    if (initialData) {
      await updateJobType.mutateAsync(
        { id: initialData.id, data: { name: data.name, default_base_salary: data.default_base_salary } },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      await createJobType.mutateAsync(data, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa loại công việc" : "Thêm loại công việc mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin loại công việc"
              : "Thêm loại công việc mới cho dịch vụ này"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên loại công việc</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Gặt lúa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_base_salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lương cơ bản</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
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
                disabled={createJobType.isPending || updateJobType.isPending}
              >
                {initialData ? "Cập nhật" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
