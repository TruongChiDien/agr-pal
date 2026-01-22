"use client";

import { use, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useJob, useUpdateJob } from "@/hooks/use-jobs";
import { useMachines } from "@/hooks/use-machines";
import { useWorkers } from "@/hooks/use-workers";
import { updateJobSchema } from "@/schemas/job";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { QuantityInput } from "@/components/forms/quantity-input";
import { formatCurrency } from "@/lib/format";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle, Info } from "lucide-react";
import { JobStatus } from "@/types/enums";
import { z } from "zod";

type UpdateJobInput = z.infer<typeof updateJobSchema>;

export default function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { id } = use(params);
  const { data: job, isLoading } = useJob(id);
  const { data: machines } = useMachines();
  const { data: workers } = useWorkers();
  const updateJob = useUpdateJob();

  const form = useForm<UpdateJobInput>({
    resolver: zodResolver(updateJobSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    values: job ? {
      status: job.status as JobStatus,
      machine_id: job.machine_id || undefined,
      notes: job.notes || "",
      worker_id: job.worker_id,
      actual_qty: Number(job.actual_qty),
    } : undefined,
  });

  // Filter machines to show only AVAILABLE ones (plus current machine if assigned)
  const availableMachines = useMemo(() => {
    if (!machines) return [];
    return machines.filter(
      (m) => m.status === "AVAILABLE" || m.id === job?.machine_id
    );
  }, [machines, job]);

  // Filter workers who have weight for this job type
  const availableWorkers = useMemo(() => {
    if (!job || !workers) return [];
    return workers.filter((w) =>
      w.worker_weights.some((ww) => ww.job_type_id === job.job_type_id)
    );
  }, [workers, job]);

  // Watch form values for wage preview
  const selectedWorkerId = form.watch("worker_id");
  const actualQty = form.watch("actual_qty");

  // Get selected worker's weight for this job type
  const selectedWorkerWeight = useMemo(() => {
    if (!selectedWorkerId || !job || !workers) return null;
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return null;
    return worker.worker_weights.find(
      (ww) => ww.job_type_id === job.job_type_id
    );
  }, [workers, selectedWorkerId, job]);

  // Calculate wage preview
  const wagePreview = useMemo(() => {
    if (!selectedWorkerWeight || actualQty === undefined) return null;
    const base = Number(selectedWorkerWeight.job_type.default_base_salary);
    const weight = Number(selectedWorkerWeight.weight);
    const finalPay = actualQty * base * weight;
    return { base, weight, finalPay };
  }, [selectedWorkerWeight, actualQty]);

  const onSubmit = async (data: UpdateJobInput) => {
    // Clean up empty optional fields
    const cleanedData = {
      ...data,
      machine_id: data.machine_id || undefined,
      notes: data.notes || undefined,
    };

    await updateJob.mutateAsync(
      { id, data: cleanedData },
      {
        onSuccess: () => router.push(redirectTo || `/jobs/${id}`),
      }
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection
          title="Chỉnh sửa công việc"
          description="Đang tải thông tin công việc..."
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!job) {
    return (
      <PageContainer>
        <ContentSection
          title="Không tìm thấy"
          description="Công việc không tồn tại hoặc đã bị xóa"
          actions={
            <Button variant="outline" onClick={() => router.push("/jobs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          }
        >
          <div className="text-center text-muted-foreground">
            Không tìm thấy công việc
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const isLocked = !!job.payroll_id;

  return (
    <PageContainer>
      <ContentSection
        title="Chỉnh sửa công việc"
        description={`Cập nhật thông tin cho công việc ${job.id.slice(0, 8).toUpperCase()}`}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        {isLocked && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Công việc này đã được thêm vào bảng lương. Không thể chỉnh sửa
              thông tin công nhân và lương để đảm bảo tính nhất quán của dữ liệu.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            {/* Readonly Fields */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{job.booking.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dịch vụ</p>
                <p className="font-medium">{job.booking.service.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loại công việc</p>
                <p className="font-medium">{job.job_type.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Đơn hàng</p>
                <p className="font-medium">
                  {job.booking.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={JobStatus.New}>Mới</SelectItem>
                      <SelectItem value={JobStatus.InProgress}>
                        Đang xử lý
                      </SelectItem>
                      <SelectItem value={JobStatus.Completed}>
                        Hoàn thành
                      </SelectItem>
                      <SelectItem value={JobStatus.Blocked}>
                        Bị chặn
                      </SelectItem>
                      <SelectItem value={JobStatus.Canceled}>
                        Đã hủy
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Worker Select */}
            <FormField
              control={form.control}
              name="worker_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Công nhân</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={isLocked}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn công nhân" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableWorkers.map((w) => {
                        const weight = w.worker_weights.find(
                          (ww) => ww.job_type_id === job.job_type_id
                        );
                        return (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name} (Hệ số: {Number(weight?.weight || 1).toFixed(2)})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Chỉ hiển thị công nhân có hệ số lương cho loại công việc này
                  </FormDescription>
                  <FormMessage />
                  {isLocked && (
                    <FormDescription className="text-amber-600">
                      Trường này bị khóa vì công việc đã được thêm vào bảng lương
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Actual Quantity */}
            <FormField
              control={form.control}
              name="actual_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Số lượng làm việc ({job.job_type.service.unit})
                  </FormLabel>
                  <FormControl>
                    <QuantityInput
                      value={field.value || 0}
                      onChange={field.onChange}
                      unit={job.job_type.service.unit}
                      min={0}
                      step={1}
                      disabled={isLocked}
                    />
                  </FormControl>
                  <FormDescription>
                    Số lượng công việc mà công nhân đã hoàn thành
                  </FormDescription>
                  <FormMessage />
                  {isLocked && (
                    <FormDescription className="text-amber-600">
                      Trường này bị khóa vì công việc đã được thêm vào bảng lương
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Wage Preview */}
            {wagePreview && !isLocked && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900">
                      Tính lương tạm tính (nếu lưu thay đổi):
                    </p>
                    <div className="font-mono text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số lượng:</span>
                        <span>{actualQty || 0} {job.job_type.service.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lương cơ bản:</span>
                        <span>{formatCurrency(wagePreview.base)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hệ số:</span>
                        <span>× {wagePreview.weight.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between items-center">
                        <span className="font-semibold">Tổng lương mới:</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(wagePreview.finalPay)}
                        </span>
                      </div>
                    </div>
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Lương sẽ được tính lại dựa trên số lượng mới và hệ số
                        hiện tại của công nhân.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Machine Field */}
            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máy móc</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "NONE" ? undefined : value);
                    }}
                    value={field.value || "NONE"}
                    defaultValue={field.value || "NONE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn máy móc (tùy chọn)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">
                        <span className="text-muted-foreground">Không sử dụng máy</span>
                      </SelectItem>
                      {availableMachines.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Có thể cập nhật máy móc cho công việc
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập ghi chú về công việc (nếu có)"
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

            <div className="flex gap-2">
              <Button type="submit" disabled={updateJob.isPending}>
                {updateJob.isPending ? "Đang cập nhật..." : "Cập nhật"}
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
