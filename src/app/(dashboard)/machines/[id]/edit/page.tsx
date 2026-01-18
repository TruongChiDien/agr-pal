"use client";

import { use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMachine, useUpdateMachine } from "@/hooks/use-machines";
import { updateMachineSchema } from "@/schemas/machine";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/forms/date-picker";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { MachineStatus } from "@/types/enums";

type UpdateMachineInput = z.infer<typeof updateMachineSchema>;

export default function EditMachinePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: machine, isLoading } = useMachine(id);
  const updateMachine = useUpdateMachine();

  const form = useForm<UpdateMachineInput>({
    resolver: zodResolver(updateMachineSchema),
    defaultValues: {
      name: "",
      model: "",
      type: "",
      purchase_date: undefined,
      status: MachineStatus.Available,
    },
  });

  // Pre-fill form when machine data loads
  useEffect(() => {
    if (machine) {
      form.reset({
        name: machine.name,
        model: machine.model || "",
        type: machine.type || "",
        purchase_date: machine.purchase_date || undefined,
        status: machine.status as MachineStatus,
      });
    }
  }, [machine, form]);

  const onSubmit = async (data: UpdateMachineInput) => {
    await updateMachine.mutateAsync(
      { id, data },
      {
        onSuccess: () => router.push(`/machines/${id}`),
      }
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection
          title="Chỉnh sửa máy"
          description="Đang tải thông tin máy..."
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!machine) {
    return (
      <PageContainer>
        <ContentSection
          title="Không tìm thấy"
          description="Máy không tồn tại hoặc đã bị xóa"
          actions={
            <Button variant="outline" onClick={() => router.push("/machines")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          }
        >
          <div className="text-center text-muted-foreground">
            Không tìm thấy máy
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Chỉnh sửa máy"
        description={`Cập nhật thông tin cho ${machine.name}`}
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={MachineStatus.Available}>Sẵn sàng</SelectItem>
                      <SelectItem value={MachineStatus.InUse}>Đang sử dụng</SelectItem>
                      <SelectItem value={MachineStatus.Maintenance}>Bảo trì</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMachine.isPending}>
                {updateMachine.isPending ? "Đang cập nhật..." : "Cập nhật"}
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
