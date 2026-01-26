"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateJob } from "@/hooks/use-jobs";
import { useMachines } from "@/hooks/use-machines";
import { useWorkers } from "@/hooks/use-workers";
import { createJobSchema } from "@/schemas/job";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { QuantityInput } from "@/components/forms/quantity-input";
import { CurrencyInput } from "@/components/forms/currency-input";
import { formatCurrency } from "@/lib/format";
import { Info, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import type { Booking, Service, Job_Type, Land, Customer } from "@prisma/client";

// Define the shape of booking prop we need
type BookingForJob = Booking & {
  service: Service & {
    job_types: Job_Type[];
  };
  customer: Customer;
  land?: Land | null;
};

type CreateJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingForJob;
};

type CreateJobInput = z.infer<typeof createJobSchema>;

export function CreateJobDialog({ open, onOpenChange, booking }: CreateJobDialogProps) {
  const createJob = useCreateJob();
  const { data: machines } = useMachines();
  const { data: workers } = useWorkers();

  const form = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema) as any,
    defaultValues: {
      booking_id: booking.id,
      job_type_id: "",
      worker_id: "",
      machine_id: undefined,
      notes: "",

      actual_qty: 0,
      payment_adjustment: 0,
    },
  });

  // Effect to reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        booking_id: booking.id,
        job_type_id: "",
        worker_id: "",
        machine_id: undefined,
        notes: "",
        actual_qty: 0,
        payment_adjustment: 0,
      });
    }
  }, [open, booking.id, form]);

  const selectedJobTypeId = form.watch("job_type_id");
  const selectedWorkerId = form.watch("worker_id");
  const actualQty = form.watch("actual_qty");
  const paymentAdjustment = form.watch("payment_adjustment");

  const availableJobTypes = useMemo(() => {
    return booking.service.job_types || [];
  }, [booking]);

  const availableMachines = useMemo(() => {
    return machines?.filter((m) => m.status === "AVAILABLE");
  }, [machines]);

  const availableWorkers = useMemo(() => {
    if (!selectedJobTypeId || !workers) return [];
    return workers.filter((w) =>
      w.worker_weights.some((ww) => ww.job_type_id === selectedJobTypeId)
    );
  }, [workers, selectedJobTypeId]);

  const selectedWorkerWeight = useMemo(() => {
    if (!selectedWorkerId || !selectedJobTypeId || !workers) return null;
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return null;
    return worker.worker_weights.find(
      (ww) => ww.job_type_id === selectedJobTypeId
    );
  }, [workers, selectedWorkerId, selectedJobTypeId]);

  const wagePreview = useMemo(() => {
    if (!selectedWorkerWeight) return null;
    const base = Number(selectedWorkerWeight.job_type.default_base_salary);
    const weight = Number(selectedWorkerWeight.weight);
    const calculatedPay = (actualQty || 0) * base * weight;
    const finalPay = calculatedPay + (paymentAdjustment || 0);
    return { base, weight, finalPay, calculatedPay };
  }, [selectedWorkerWeight, actualQty, paymentAdjustment]);

  // Reset worker when job_type changes
  useEffect(() => {
    if (selectedJobTypeId) {
      form.setValue("worker_id", "");
      form.setValue("actual_qty", 0);
    }
  }, [selectedJobTypeId, form]);

  const onSubmit = async (data: CreateJobInput) => {
    const payload = {
      ...data,
      machine_id: data.machine_id === "NONE" ? undefined : data.machine_id,
      notes: data.notes || undefined,
      actual_qty: data.actual_qty || 0,
      payment_adjustment: data.payment_adjustment,
    };

    const result = await createJob.mutateAsync(payload);
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo công việc mới</DialogTitle>
          <DialogDescription>
            Thêm công việc cho đơn hàng <strong>{booking.customer.name} - {booking.service.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Job Type Select */}
            <FormField
              control={form.control}
              name="job_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại công việc *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableJobTypes.length === 0
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
                  {availableJobTypes.length === 0 && (
                    <FormDescription className="text-destructive">
                      Dịch vụ này chưa có loại công việc nào. Vui lòng liên hệ quản trị viên.
                    </FormDescription>
                  )}
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
                            {w.name} (Hs: {Number(weight?.weight || 1).toFixed(2)})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            {selectedWorkerId && (
              <FormField
                control={form.control}
                name="actual_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Số lượng ({selectedWorkerWeight?.job_type.service.unit || ""})
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}



            {/* Machine Select */}
            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máy móc (tùy chọn)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Handle "NONE" value
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wage Preview Block (Moved to bottom) */}
            {wagePreview && selectedWorkerId && (
              <div className="space-y-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900">
                        Chi tiết lương tạm tính:
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
                        {paymentAdjustment !== 0 && (
                          <div className="flex justify-between font-medium">
                            <span className="text-muted-foreground">Điều chỉnh:</span>
                            <span className={paymentAdjustment > 0 ? "text-green-600" : "text-red-600"}>
                              {paymentAdjustment > 0 ? "+" : "-"} {formatCurrency(Math.abs(paymentAdjustment))}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                          <span className="font-semibold text-blue-900">Tổng lương:</span>
                          <span className="text-xl font-bold text-primary">
                            {formatCurrency(wagePreview.finalPay)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced: Salary Adjustment */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="link" size="sm" type="button" className="px-0 h-auto">
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Điều chỉnh lương (Thưởng / Phạt)
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="payment_adjustment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số tiền điều chỉnh (+/-)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CurrencyInput
                                value={field.value || 0}
                                onChange={field.onChange}
                                min={-1000000000} // Allow negative
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Nhập số dương để thưởng, số âm để phạt/trừ tiền.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú..."
                      className="resize-none"
                      rows={2}
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
              <Button
                type="submit"
                disabled={createJob.isPending || availableJobTypes.length === 0}
              >
                {createJob.isPending ? "Đang tạo..." : "Tạo công việc"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
