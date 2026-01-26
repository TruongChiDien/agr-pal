"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateJob } from "@/hooks/use-jobs";
import { useMachines } from "@/hooks/use-machines";
import { useWorkers } from "@/hooks/use-workers";
import { updateJobSchema } from "@/schemas/job";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { QuantityInput } from "@/components/forms/quantity-input";
import { CurrencyInput } from "@/components/forms/currency-input";
import { formatCurrency } from "@/lib/format";
import { Info, ChevronDown, AlertTriangle } from "lucide-react";
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
import type { Job, Booking, Service, Job_Type, Customer } from "@prisma/client";
import { JobStatus } from "@/types/enums";

// Define the shape of valid job for update props
type JobForUpdate = Job & {
  job_type: Job_Type & {
    service: Service;
  };
  booking: Booking & {
    customer: Customer;
    service: Service;
  };
};

type UpdateJobDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobForUpdate;
};

type UpdateJobInput = z.infer<typeof updateJobSchema>;

export function UpdateJobDialog({ open, onOpenChange, job }: UpdateJobDialogProps) {
  const updateJob = useUpdateJob();
  const { data: machines } = useMachines();
  const { data: workers } = useWorkers();

  const isLocked = !!job.payroll_id;

  const form = useForm<UpdateJobInput>({
    resolver: zodResolver(updateJobSchema) as any,
    defaultValues: {
      status: job.status as JobStatus,
      machine_id: job.machine_id || undefined,
      notes: job.notes || "",
      worker_id: job.worker_id,
      actual_qty: Number(job.actual_qty),
      payment_adjustment: Number((job as any).payment_adjustment || 0),
    },
  });

  // Reset form when dialog opens or job changes
  useEffect(() => {
    if (open && job) {
      form.reset({
        status: job.status as JobStatus,
        machine_id: job.machine_id || undefined,
        notes: job.notes || "",
        worker_id: job.worker_id,
        actual_qty: Number(job.actual_qty),
        payment_adjustment: Number((job as any).payment_adjustment || 0),
      });
    }
  }, [open, job, form]);

  const availableMachines = useMemo(() => {
    if (!machines) return [];
    // Show available machines OR the one currently assigned to this job
    return machines.filter(
      (m) => m.status === "AVAILABLE" || m.id === job.machine_id
    );
  }, [machines, job.machine_id]);

  const selectedWorkerId = form.watch("worker_id");
  const actualQty = form.watch("actual_qty");
  const paymentAdjustment = form.watch("payment_adjustment");

  // Get selected worker's weight for this job type
  const selectedWorkerWeight = useMemo(() => {
    if (!selectedWorkerId || !job || !workers) return null;
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return null;
    return worker.worker_weights.find(
      (ww) => ww.job_type_id === job.job_type_id
    );
  }, [workers, selectedWorkerId, job]);

  const wagePreview = useMemo(() => {
    if (!selectedWorkerWeight) return null;
    const base = Number(selectedWorkerWeight.job_type.default_base_salary);
    const weight = Number(selectedWorkerWeight.weight);
    const calculatedPay = (actualQty || 0) * base * weight;
    const finalPay = calculatedPay + (paymentAdjustment || 0);
    return { base, weight, finalPay, calculatedPay };
  }, [selectedWorkerWeight, actualQty, paymentAdjustment]);

  const onSubmit = async (data: UpdateJobInput) => {
    const payload = {
      ...data,
      machine_id: data.machine_id === "NONE" ? undefined : data.machine_id,
      notes: data.notes || undefined,
      actual_qty: data.actual_qty,
      payment_adjustment: data.payment_adjustment,
    };

    const result = await updateJob.mutateAsync({ id: job.id, data: payload });
    if (result.success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật công việc</DialogTitle>
          <DialogDescription>
            {job.booking.customer.name} - {job.job_type.name}
          </DialogDescription>
        </DialogHeader>

        {isLocked && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Công việc này đã được thêm vào bảng lương. Chỉ có thể chỉnh sửa máy móc và ghi chú.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Quantity */}
            <FormField
              control={form.control}
              name="actual_qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Số lượng ({job.job_type.service.unit})
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Machine Select */}
            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máy móc (tùy chọn)</FormLabel>
                  <Select
                    onValueChange={(value) => {
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
                      {availableMachines.length > 0 ? (
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

            {/* Wage Preview Block */}
            {wagePreview && (
              <div className="space-y-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900">
                        Chi tiết lương:
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
                        {(paymentAdjustment || 0) !== 0 && (
                          <div className="flex justify-between font-medium">
                            <span className="text-muted-foreground">Điều chỉnh:</span>
                            <span className={(paymentAdjustment || 0) > 0 ? "text-green-600" : "text-red-600"}>
                              {(paymentAdjustment || 0) > 0 ? "+" : "-"} {formatCurrency(Math.abs(paymentAdjustment || 0))}
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
                {!isLocked && (
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
                )}
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
                disabled={updateJob.isPending}
              >
                {updateJob.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
