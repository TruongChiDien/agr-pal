"use client";

import { useEffect } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateMachine } from "@/hooks/use-machines";
import { createMachineSchema } from "@/schemas/machine";
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
import { DatePicker } from "@/components/forms/date-picker";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type CreateMachineInput = z.infer<typeof createMachineSchema>;

interface CreateMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMachineDialog({ open, onOpenChange }: CreateMachineDialogProps) {
  const createMachine = useCreateMachine();
  const { toast } = useToast();

  const form = useForm<CreateMachineInput>({
    resolver: zodResolver(createMachineSchema),
    mode: 'onBlur',
    defaultValues: {
      name: "",
      model: "",
      type: "",
      purchase_date: new Date(),
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        model: "",
        type: "",
        purchase_date: new Date(),
      });
    }
  }, [open, form]);

  const onSubmit = async (data: CreateMachineInput) => {
    await createMachine.mutateAsync(data, {
      onSuccess: (result) => {
        if (result.success) {
          toast({
            title: "Thành công",
            description: "Máy đã được tạo",
          });
          onOpenChange(false);
          form.reset();
        } else {
            toast({
                title: "Lỗi",
                description: result.error || "Có lỗi xảy ra",
                variant: 'destructive',
            });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo máy mới</DialogTitle>
          <DialogDescription>
            Thêm máy móc nông nghiệp vào hệ thống
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên máy *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Máy cày Kubota" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: M7040"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Máy cày, Máy gặt"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchase_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày mua</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      maxDate={new Date()}
                      placeholder="Chọn ngày mua"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                 type="button"
                 variant="outline"
                 onClick={() => onOpenChange(false)}
               >
                 Hủy
               </Button>
              <Button type="submit" disabled={createMachine.isPending}>
                {createMachine.isPending ? "Đang tạo..." : "Tạo máy"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
