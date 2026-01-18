"use client";

import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useWorker, useUpdateWorker } from "@/hooks/use-workers";
import { updateWorkerSchema } from "@/schemas/worker";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;

export default function EditWorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: worker, isLoading } = useWorker(id);
  const updateWorker = useUpdateWorker();

  const form = useForm<UpdateWorkerInput>({
    resolver: zodResolver(updateWorkerSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });

  // Pre-fill form when worker data loads
  useEffect(() => {
    if (worker) {
      form.reset({
        name: worker.name,
        phone: worker.phone || "",
        address: worker.address || "",
      });
    }
  }, [worker, form]);

  const onSubmit = async (data: UpdateWorkerInput) => {
    await updateWorker.mutateAsync(
      { id, data },
      {
        onSuccess: () => router.push(`/workers/${id}`),
      }
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection
          title="Chỉnh sửa công nhân"
          description="Đang tải thông tin công nhân..."
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!worker) {
    return (
      <PageContainer>
        <ContentSection
          title="Không tìm thấy"
          description="Công nhân không tồn tại hoặc đã bị xóa"
          actions={
            <Button variant="outline" onClick={() => router.push("/workers")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          }
        >
          <div className="text-center text-muted-foreground">
            Không tìm thấy công nhân
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Chỉnh sửa công nhân"
        description={`Cập nhật thông tin cho ${worker.name}`}
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
              <Button type="submit" disabled={updateWorker.isPending}>
                {updateWorker.isPending ? "Đang cập nhật..." : "Cập nhật"}
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
