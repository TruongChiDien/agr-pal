"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateWorkerWeight, useUpdateWorkerWeight } from "@/hooks/use-workers";
import { useJobTypes } from "@/hooks/use-job-types";
import { createWorkerWeightSchema } from "@/schemas/worker";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";
import type { Worker_Weight, Job_Type } from "@prisma/client";

type WorkerWeightDialogProps = {
  open: boolean;
  onClose: () => void;
  workerId: string;
  initialData?: Worker_Weight & {
    job_type?: Job_Type & { service?: { name: string } }
  };
};

type CreateWorkerWeightInput = z.infer<typeof createWorkerWeightSchema>;

export function WorkerWeightDialog({
  open,
  onClose,
  workerId,
  initialData,
}: WorkerWeightDialogProps) {
  const createWeight = useCreateWorkerWeight();
  const updateWeight = useUpdateWorkerWeight();
  const { data: jobTypes, isLoading: isLoadingJobTypes } = useJobTypes();

  const form = useForm<CreateWorkerWeightInput>({
    resolver: zodResolver(createWorkerWeightSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      worker_id: workerId,
      job_type_id: "",
      weight: 1.0,
    },
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      form.reset({
        worker_id: workerId,
        job_type_id: initialData?.job_type_id || "",
        weight: initialData?.weight ? Number(initialData.weight) : 1.0,
      });
    }
  }, [open, initialData, workerId, form]);

  const onSubmit = async (data: CreateWorkerWeightInput) => {
    if (initialData) {
      await updateWeight.mutateAsync(
        { id: initialData.id, data: { weight: data.weight } },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      await createWeight.mutateAsync(data, {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa hệ số lương" : "Thêm hệ số lương"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật hệ số lương cho loại công việc"
              : "Thêm hệ số lương cho loại công việc mới"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Job Type Select */}
            <FormField
              control={form.control}
              name="job_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại công việc *</FormLabel>
                  {initialData ? (
                    // When editing, show the job type as read-only text
                    <div className="rounded-md border border-input bg-muted px-3 py-2">
                      <p className="text-sm">
                        {initialData.job_type?.name || "N/A"}
                        {initialData.job_type?.service?.name && (
                          <span className="text-muted-foreground">
                            {" "}({initialData.job_type.service.name})
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    // When creating, show the dropdown
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingJobTypes}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại công việc" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingJobTypes && (
                          <SelectItem value="" disabled>
                            Đang tải...
                          </SelectItem>
                        )}
                        {jobTypes?.map((jt) => (
                          <SelectItem key={jt.id} value={jt.id}>
                            {jt.name} ({jt.service?.name || "N/A"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                  {initialData && (
                    <FormDescription className="text-xs">
                      Loại công việc không thể thay đổi khi chỉnh sửa
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Weight Input */}
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hệ số lương *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5.0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    VD: 1.0 = 100%, 1.2 = 120%, 0.8 = 80%
                  </FormDescription>
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
                disabled={createWeight.isPending || updateWeight.isPending}
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
