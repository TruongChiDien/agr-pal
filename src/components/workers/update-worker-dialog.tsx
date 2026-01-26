"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateWorker } from "@/hooks/use-workers";
import { updateWorkerSchema } from "@/schemas/worker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/form";
import { z } from "zod";
import type { Worker } from "@prisma/client";

type UpdateWorkerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker;
};

type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;

export function UpdateWorkerDialog({ open, onOpenChange, worker }: UpdateWorkerDialogProps) {
  const updateWorker = useUpdateWorker();

  const form = useForm<UpdateWorkerInput>({
    resolver: zodResolver(updateWorkerSchema),
    defaultValues: {
      name: worker.name,
      phone: worker.phone || "",
      address: worker.address || "",
    },
  });

  useEffect(() => {
    if (open && worker) {
      form.reset({
        name: worker.name,
        phone: worker.phone || "",
        address: worker.address || "",
      });
    }
  }, [open, worker, form]);

  const onSubmit = async (data: UpdateWorkerInput) => {
    const result = await updateWorker.mutateAsync({ id: worker.id, data });
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin công nhân</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin chi tiết cho <strong>{worker.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên công nhân *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="09xxxxxxx" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Địa chỉ..." 
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateWorker.isPending}>
                {updateWorker.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
