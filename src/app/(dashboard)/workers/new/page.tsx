"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateWorker } from "@/hooks/use-workers";
import { createWorkerSchema } from "@/schemas/worker";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

type CreateWorkerInput = z.infer<typeof createWorkerSchema>;

export default function CreateWorkerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const createWorker = useCreateWorker();

  const form = useForm<CreateWorkerInput>({
    resolver: zodResolver(createWorkerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: "",
      phone: "",
      address: ""
    },
  });

  const onSubmit = async (data: CreateWorkerInput) => {
    await createWorker.mutateAsync(data, {
      onSuccess: (result) => {
        if (result.success && result.data?.id) {
          router.push(redirectTo || `/workers/${result.data.id}`);
        }
      },
    });
  };

  return (
    <PageContainer>
      <ContentSection
        title="Tạo công nhân mới"
        description="Thêm công nhân vào hệ thống"
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
                  <FormLabel>Tên công nhân *</FormLabel>
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
              <Button type="submit" disabled={createWorker.isPending}>
                {createWorker.isPending ? "Đang tạo..." : "Tạo công nhân"}
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
