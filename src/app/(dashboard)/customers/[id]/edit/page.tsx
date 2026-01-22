"use client";

import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import { updateCustomerSchema } from "@/schemas/customer";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { id } = use(params);
  const { data: customer, isLoading } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();

  const form = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });

  // Pre-fill form when customer data loads
  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
  }, [customer, form]);

  const onSubmit = async (data: UpdateCustomerInput) => {
    await updateCustomer.mutateAsync(
      { id, data },
      {
        onSuccess: () => router.push(redirectTo || `/customers/${id}`),
      }
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection
          title="Chỉnh sửa khách hàng"
          description="Đang tải thông tin khách hàng..."
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer>
        <ContentSection
          title="Không tìm thấy"
          description="Khách hàng không tồn tại hoặc đã bị xóa"
          actions={
            <Button variant="outline" onClick={() => router.push("/customers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          }
        >
          <div className="text-center text-muted-foreground">
            Không tìm thấy khách hàng
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Chỉnh sửa khách hàng"
        description={`Cập nhật thông tin cho ${customer.name}`}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên khách hàng *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Nguyễn Văn A" {...field} />
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
                    <Input
                      placeholder="VD: 0912-345-678"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: 123 Đường ABC, Quận XYZ"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Form>
      </ContentSection>
    </PageContainer>
  );
}
