"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateService } from "@/hooks/use-services";
import { createServiceSchema } from "@/schemas/service";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CurrencyInput } from "@/components/forms/currency-input";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

type CreateServiceInput = z.infer<typeof createServiceSchema>;

export default function CreateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const createService = useCreateService();

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
        if (result.success && result.data?.id) {
          router.push(redirectTo || `/services/${result.data.id}`);
        }
      },
    });
  };

  return (
    <PageContainer>
      <ContentSection
        title="Tạo dịch vụ mới"
        description="Thêm dịch vụ nông nghiệp vào hệ thống"
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

            <div className="flex gap-2">
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? "Đang tạo..." : "Tạo dịch vụ"}
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
