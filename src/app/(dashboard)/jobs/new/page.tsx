"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateJob } from "@/hooks/use-jobs";
import { useBookings } from "@/hooks/use-bookings";
import { useMachines } from "@/hooks/use-machines";
import { useWorkers } from "@/hooks/use-workers";
import { createJobSchema } from "@/schemas/job";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ArrowLeft, Info } from "lucide-react";
import { BookingStatus } from "@/types/enums";
import { z } from "zod";

type CreateJobInput = z.infer<typeof createJobSchema>;

export default function CreateJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingIdFromUrl = searchParams.get("booking_id");

  const createJob = useCreateJob();
  const { data: bookings, isLoading: bookingsLoading } = useBookings();
  const { data: machines, isLoading: machinesLoading } = useMachines();
  const { data: workers, isLoading: workersLoading } = useWorkers();

  const form = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      booking_id: bookingIdFromUrl || "",
      job_type_id: "",
      worker_id: "",
      machine_id: undefined,
      notes: "",
      actual_qty: 0,
      applied_base: undefined,
      applied_weight: undefined,
      final_pay: undefined,
    },
  });

  const selectedBookingId = form.watch("booking_id");
  const selectedJobTypeId = form.watch("job_type_id");
  const selectedWorkerId = form.watch("worker_id");
  const actualQty = form.watch("actual_qty");

  // Filter bookings to show only NEW and IN_PROGRESS
  const availableBookings = useMemo(() => {
    return bookings?.filter(
      (b) =>
        b.status === BookingStatus.New || b.status === BookingStatus.InProgress
    );
  }, [bookings]);

  // Get selected booking and its service's job types
  const selectedBooking = useMemo(() => {
    return availableBookings?.find((b) => b.id === selectedBookingId);
  }, [availableBookings, selectedBookingId]);

  const availableJobTypes = useMemo(() => {
    return selectedBooking?.service?.job_types || [];
  }, [selectedBooking]);

  // Filter machines to show only AVAILABLE ones
  const availableMachines = useMemo(() => {
    return machines?.filter((m) => m.status === "AVAILABLE");
  }, [machines]);

  // Filter workers who have weight for selected job type
  const availableWorkers = useMemo(() => {
    if (!selectedJobTypeId || !workers) return [];
    return workers.filter((w) =>
      w.worker_weights.some((ww) => ww.job_type_id === selectedJobTypeId)
    );
  }, [workers, selectedJobTypeId]);

  // Get selected worker's weight for this job type
  const selectedWorkerWeight = useMemo(() => {
    if (!selectedWorkerId || !selectedJobTypeId || !workers) return null;
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return null;
    return worker.worker_weights.find(
      (ww) => ww.job_type_id === selectedJobTypeId
    );
  }, [workers, selectedWorkerId, selectedJobTypeId]);

  // Calculate wage preview
  const wagePreview = useMemo(() => {
    if (!selectedWorkerWeight || actualQty === undefined) return null;
    const base = Number(selectedWorkerWeight.job_type.default_base_salary);
    const weight = Number(selectedWorkerWeight.weight);
    const finalPay = actualQty * base * weight;
    return { base, weight, finalPay };
  }, [selectedWorkerWeight, actualQty]);

  // Reset job_type when booking changes
  useEffect(() => {
    if (selectedBookingId) {
      form.setValue("job_type_id", "");
      form.setValue("worker_id", "");
      form.setValue("actual_qty", 0);
    }
  }, [selectedBookingId, form]);

  // Reset worker when job_type changes
  useEffect(() => {
    if (selectedJobTypeId) {
      form.setValue("worker_id", "");
      form.setValue("actual_qty", 0);
    }
  }, [selectedJobTypeId, form]);

  const onSubmit = async (data: CreateJobInput) => {
    // Clean up empty optional fields and calculate snapshots
    const payload = {
      ...data,
      machine_id: data.machine_id || undefined,
      notes: data.notes || undefined,
      actual_qty: data.actual_qty || 0,
      // These will be calculated in the action if not provided
      applied_base: data.applied_base,
      applied_weight: data.applied_weight,
      final_pay: data.final_pay,
    };

    const result = await createJob.mutateAsync(payload);
    if (result.success && result.data) {
      router.push(`/jobs/${result.data.id}`);
    }
  };

  const isLoading = bookingsLoading || machinesLoading || workersLoading;

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Tạo công việc mới" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Tạo công việc mới"
        description="Tạo công việc từ đơn hàng và phân công máy móc, công nhân"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            {/* Pre-filled Booking Info (if booking_id from URL) */}
            {bookingIdFromUrl && selectedBooking && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-medium mb-1">Đơn hàng đã chọn:</p>
                  <p className="text-sm">
                    {selectedBooking.customer.name} - {selectedBooking.service.name}
                    {selectedBooking.land && ` (${selectedBooking.land.name})`}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Booking Select (FIRST) */}
            <FormField
              control={form.control}
              name="booking_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn hàng *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!bookingIdFromUrl}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn đơn hàng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBookings && availableBookings.length > 0 ? (
                        availableBookings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.customer.name} - {b.service.name}
                            {b.land && ` (${b.land.name})`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="NONE" disabled>
                          Không có đơn hàng khả dụng
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {bookingIdFromUrl
                      ? "Đơn hàng được chọn từ trang chi tiết đơn hàng"
                      : "Chỉ hiển thị đơn hàng có trạng thái MỚI hoặc ĐANG XỬ LÝ"
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Type Select (SECOND - Depends on Booking) */}
            <FormField
              control={form.control}
              name="job_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại công việc *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedBookingId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !selectedBookingId
                              ? "Chọn đơn hàng trước"
                              : availableJobTypes.length === 0
                              ? "Dịch vụ này chưa có loại công việc"
                              : "Chọn loại công việc"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableJobTypes.map((jt) => (
                        <SelectItem key={jt.id} value={jt.id}>
                          {jt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBooking && (
                    <FormDescription>
                      Loại công việc thuộc dịch vụ:{" "}
                      <strong>{selectedBooking.service.name}</strong>
                    </FormDescription>
                  )}
                  {selectedBookingId && availableJobTypes.length === 0 && (
                    <FormDescription className="text-amber-600">
                      Dịch vụ này chưa có loại công việc nào. Vui lòng thêm loại công
                      việc cho dịch vụ trước.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Worker Select (THIRD - REQUIRED, cascades from job_type) */}
            <FormField
              control={form.control}
              name="worker_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Công nhân *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedJobTypeId || availableWorkers.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !selectedJobTypeId
                              ? "Chọn loại công việc trước"
                              : availableWorkers.length === 0
                              ? "Không có công nhân phù hợp"
                              : "Chọn công nhân"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableWorkers.map((w) => {
                        const weight = w.worker_weights.find(
                          (ww) => ww.job_type_id === selectedJobTypeId
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
                </FormItem>
              )}
            />

            {/* Actual Quantity (FOURTH - optional, default 0) */}
            {selectedWorkerId && (
              <FormField
                control={form.control}
                name="actual_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Số lượng làm việc ({selectedWorkerWeight?.job_type.service.unit || ""})
                    </FormLabel>
                    <FormControl>
                      <QuantityInput
                        value={field.value || 0}
                        onChange={field.onChange}
                        unit={selectedWorkerWeight?.job_type.service.unit}
                        min={0}
                        step={1}
                      />
                    </FormControl>
                    <FormDescription>
                      Nhập số lượng công việc mà công nhân đã hoàn thành (mặc định: 0, có thể cập nhật sau)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Wage Preview */}
            {wagePreview && selectedWorkerId && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-900">
                      Tính lương tạm tính:
                    </p>
                    <div className="font-mono text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số lượng:</span>
                        <span>{actualQty || 0} {selectedWorkerWeight?.job_type.service.unit}</span>
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
                        <span className="font-semibold">Tổng lương:</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(wagePreview.finalPay)}
                        </span>
                      </div>
                    </div>
                    <Alert className="mt-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Lương này sẽ được ghi nhận snapshot và không thay đổi ngay cả khi lương
                        cơ bản hoặc hệ số thay đổi sau này.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Machine Select (FIFTH - Optional) */}
            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máy móc (tùy chọn)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Convert "NONE" back to undefined
                      field.onChange(value === "NONE" ? undefined : value);
                    }}
                    value={field.value || "NONE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn máy móc (nếu cần)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">
                        <span className="text-muted-foreground">Không sử dụng máy</span>
                      </SelectItem>
                      {availableMachines && availableMachines.length > 0 ? (
                        availableMachines.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="NO_MACHINES" disabled>
                          Không có máy khả dụng
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Chỉ hiển thị máy có trạng thái SẴN SÀNG. Có thể bỏ qua nếu không cần
                    máy.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes (Optional) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú về công việc (nếu có)"
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

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={
                  createJob.isPending ||
                  availableJobTypes.length === 0
                }
                className="min-w-[120px]"
              >
                {createJob.isPending
                  ? "Đang tạo..."
                  : "Tạo công việc"}
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
