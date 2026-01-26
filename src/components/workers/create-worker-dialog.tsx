"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateWorker } from "@/hooks/use-workers";
import { createWorkerSchema } from "@/schemas/worker";
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

type CreateWorkerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CreateWorkerInput = z.infer<typeof createWorkerSchema>;

export function CreateWorkerDialog({ open, onOpenChange }: CreateWorkerDialogProps) {
  const createWorker = useCreateWorker();

  const form = useForm<CreateWorkerInput>({
    resolver: zodResolver(createWorkerSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: CreateWorkerInput) => {
    const result = await createWorker.mutateAsync(data);
    if (result.success) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm công nhân mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin công nhân mới vào bên dưới.
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
              <Button type="submit" disabled={createWorker.isPending}>
                {createWorker.isPending ? "Đang tạo..." : "Tạo công nhân"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
