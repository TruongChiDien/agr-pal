"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateCustomer } from "@/hooks/use-customers";
import { updateCustomerSchema } from "@/schemas/customer";
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
import type { Customer } from "@prisma/client";

type UpdateCustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
};

type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export function UpdateCustomerDialog({ open, onOpenChange, customer }: UpdateCustomerDialogProps) {
  const updateCustomer = useUpdateCustomer();

  const form = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
    },
  });

  useEffect(() => {
    if (open && customer) {
      form.reset({
        name: customer.name,
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
  }, [open, customer, form]);

  const onSubmit = async (data: UpdateCustomerInput) => {
    const result = await updateCustomer.mutateAsync({ id: customer.id, data });
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cập nhật thông tin khách hàng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin chi tiết cho <strong>{customer.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khách hàng *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
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
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
