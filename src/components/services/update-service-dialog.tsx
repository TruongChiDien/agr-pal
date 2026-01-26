"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateService } from "@/hooks/use-services";
import { updateServiceSchema } from "@/schemas/service";
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
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@prisma/client";

type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

interface UpdateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}

export function UpdateServiceDialog({ open, onOpenChange, service }: UpdateServiceDialogProps) {
  const updateService = useUpdateService();
  const { toast } = useToast();

  const form = useForm<UpdateServiceInput>({
    resolver: zodResolver(updateServiceSchema),
    defaultValues: {
      name: "",
      unit: "",
      price: 0,
      description: "",
    },
  });

  // Pre-fill form when service data loads or changes
  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        unit: service.unit,
        price: Number(service.price),
        description: service.description || "",
      });
    }
  }, [service, form]);

  const onSubmit = async (data: UpdateServiceInput) => {
    await updateService.mutateAsync(
      { id: service.id, data },
      {
        onSuccess: (result) => {
           if (result.success) {
               toast({
                   title: "Thành công",
                   description: "Đã cập nhật dịch vụ",
               });
               onOpenChange(false);
           } else {
               toast({
                   title: "Lỗi",
                   description: result.error || "Có lỗi xảy ra",
                   variant: "destructive"
               });
           }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
          <DialogDescription>
             Cập nhật thông tin cho {service.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên dịch vụ *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Cày ruộng" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn vị tính *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: hecta, tấn, giờ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá hiện tại *</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value || 0}
                      onChange={field.onChange}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Mô tả chi tiết về dịch vụ"
                      {...field}
                      value={field.value || ""}
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
              <Button type="submit" disabled={updateService.isPending}>
                {updateService.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
