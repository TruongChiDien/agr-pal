"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateService } from "@/hooks/use-services";
import { createServiceSchema } from "@/schemas/service";
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

type CreateServiceInput = z.infer<typeof createServiceSchema>;

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateServiceDialog({ open, onOpenChange }: CreateServiceDialogProps) {
  const createService = useCreateService();
  const { toast } = useToast();

  const form = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: "",
      unit: "",
      price: 0,
      description: ""
    },
  });

  const onSubmit = async (data: CreateServiceInput) => {
    await createService.mutateAsync(data, {
      onSuccess: (result) => {
        if (result.success) {
          toast({
            title: "Thành công",
            description: "Dịch vụ đã được tạo",
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
          <DialogTitle>Tạo dịch vụ mới</DialogTitle>
          <DialogDescription>
            Thêm dịch vụ nông nghiệp vào hệ thống
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
                      value={field.value}
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
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? "Đang tạo..." : "Tạo dịch vụ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
