"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateMachine } from "@/hooks/use-machines";
import { createMachineSchema } from "@/schemas/machine";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/forms/date-picker";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";

type CreateMachineInput = z.infer<typeof createMachineSchema>;

export default function CreateMachinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const createMachine = useCreateMachine();

  const form = useForm<CreateMachineInput>({
    resolver: zodResolver(createMachineSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: "",
      model: "",
      type: "",
      purchase_date: undefined,
    },
  });

  const onSubmit = async (data: CreateMachineInput) => {
    await createMachine.mutateAsync(data, {
      onSuccess: (result) => {
        if (result.success && result.data?.id) {
          router.push(redirectTo || `/machines/${result.data.id}`);
        }
      },
    });
  };

  return (
    <PageContainer>
      <ContentSection
        title="Tạo máy mới"
        description="Thêm máy móc nông nghiệp vào hệ thống"
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

            <div className="flex gap-2">
              <Button type="submit" disabled={createMachine.isPending}>
                {createMachine.isPending ? "Đang tạo..." : "Tạo máy"}
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
