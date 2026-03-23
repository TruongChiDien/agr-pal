"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdatePayroll, usePayroll } from "@/hooks/use-payroll";
import { useWorkers } from "@/hooks/use-workers";
import { JobWorkerSelector } from "@/components/payroll/job-worker-selector";
import { AdvanceSelector } from "@/components/payroll/advance-selector";
import { PayrollPreview } from "@/components/payroll/payroll-preview";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPayrollSchema } from "@/schemas/payroll";
import type { Payroll_Sheet, Advance_Payment, Worker, DailyMachineWorker } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

// Use create schema for validation, but we handle updates
type CreatePayrollInput = any; // Simplify for now

interface UpdatePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll_Sheet & {
    worker?: Worker;
    daily_workers?: DailyMachineWorker[];
    advance_payments?: Advance_Payment[];
  };
}

export function UpdatePayrollDialog({ open, onOpenChange, payroll }: UpdatePayrollDialogProps) {
  const updatePayroll = useUpdatePayroll();
  const { data: fetchedPayroll, isLoading: isLoadingPayroll } = usePayroll(payroll.id);
  const { toast } = useToast();

  const activePayroll = fetchedPayroll || payroll;

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<string[]>([]);
  
  const [sourceJobs, setSourceJobs] = useState<any[]>([]);
  const [sourceAdvances, setSourceAdvances] = useState<Advance_Payment[]>([]);

  // Check if locked
  const isPaid = Number(activePayroll.total_paid) > 0;

  const form = useForm<CreatePayrollInput>({
    resolver: zodResolver(createPayrollSchema),
    mode: 'onBlur',
    defaultValues: {
      worker_id: activePayroll.worker_id,
      job_ids: [],
      advance_payment_ids: [],
      adjustment: Number((activePayroll as any).adjustment) || undefined,
      notes: (activePayroll as any).notes || "",
    },
  });

  // Reset form when dialog opens or payroll changes
  useEffect(() => {
    if (open && activePayroll) {
      const anyPayroll = activePayroll as any;
      const jobIds = anyPayroll.daily_workers?.map((j: any) => j.id) || [];
      const advanceIds = anyPayroll.advance_payments?.map((a: any) => a.id) || [];
      
      form.reset({
        worker_id: activePayroll.worker_id,
        job_ids: jobIds,
        advance_payment_ids: advanceIds,
        adjustment: Number(anyPayroll.adjustment) || undefined,
        notes: anyPayroll.notes || "",
      });

      setSelectedJobIds(jobIds);
      setSelectedAdvanceIds(advanceIds);
    }
  }, [open, activePayroll, form]);

  // Sync state with form
  useEffect(() => {
    form.setValue("job_ids", selectedJobIds);
  }, [selectedJobIds, form]);

  useEffect(() => {
    form.setValue("advance_payment_ids", selectedAdvanceIds);
  }, [selectedAdvanceIds, form]);


  const onSubmit = async (data: CreatePayrollInput) => {
    if (selectedJobIds.length === 0 && !isPaid) { // Only check if editable
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất 1 công việc",
        variant: "destructive",
      });
      return;
    }

    const payload = {
        id: payroll.id,
        ...data,
        job_ids: selectedJobIds,
        advance_payment_ids: selectedAdvanceIds.length > 0 ? selectedAdvanceIds : undefined,
    };

    // If paid, we might only send partial data, but easiest is to send everything and let server ignore restricted fields.
    // Server logic handles `if (total_paid > 0)`.

    const result = await updatePayroll.mutateAsync(payload);

    if (result.success) {
      onOpenChange(false);
    }
  };

  // Ensure selection matches source for Paid payrolls (Strict consistency)
  useEffect(() => {
     if (isPaid && sourceJobs.length > 0 && selectedJobIds.length === 0) {
         setSelectedJobIds(sourceJobs.map(j => j.id));
     }
  }, [isPaid, sourceJobs, selectedJobIds]);

  // Same for Advances
  useEffect(() => {
     if (isPaid && sourceAdvances.length > 0 && selectedAdvanceIds.length === 0) {
         setSelectedAdvanceIds(sourceAdvances.map(a => a.id));
     }
  }, [isPaid, sourceAdvances, selectedAdvanceIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật phiếu lương</DialogTitle>
          <DialogDescription>
            {isPaid 
             ? "Phiếu lương đã thanh toán. Bạn chỉ có thể cập nhật ghi chú." 
             : "Cập nhật thông tin phiếu lương"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
             <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span>Công nhân:</span>
                <span className="font-medium text-foreground">{activePayroll.worker?.name || "—"}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`border rounded-md p-4 flex flex-col h-[300px] md:h-[400px] bg-card shadow-sm ${isPaid ? 'opacity-50 pointer-events-none' : ''}`}>
                     <JobWorkerSelector
                        workerId={activePayroll.worker_id}
                        selectedJobIds={selectedJobIds}
                        onSelectionChange={setSelectedJobIds}
                        payrollId={activePayroll.id}
                        isPaid={isPaid}
                        onLoaded={setSourceJobs}
                    />
                  </div>
                  <div className={`border rounded-md p-4 flex flex-col h-[300px] md:h-[400px] bg-card shadow-sm ${isPaid ? 'opacity-50 pointer-events-none' : ''}`}>
                    <AdvanceSelector
                        workerId={activePayroll.worker_id}
                        selectedAdvanceIds={selectedAdvanceIds}
                        onSelectionChange={setSelectedAdvanceIds}
                        payrollId={activePayroll.id}
                        isPaid={isPaid}
                        onLoaded={setSourceAdvances}
                    />
                  </div>
            </div>

            <FormField
                control={form.control}
                name="adjustment"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Điều chỉnh (Nghìn VNĐ)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="0"
                                {...field}
                                value={field.value || ""}
                                disabled={isPaid}
                                onChange={e => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : Number(val));
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <PayrollPreview
                workerId={activePayroll.worker_id}
                selectedJobIds={selectedJobIds}
                selectedAdvanceIds={selectedAdvanceIds}
                adjustment={form.watch("adjustment")} 
                sourceJobs={sourceJobs}
                sourceAdvances={sourceAdvances}
            />

            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ghi chú</FormLabel>
                        <FormControl>
                            <Textarea 
                                {...field} 
                                placeholder="Ghi chú thêm..."
                                className="resize-none"
                                rows={2}
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
                disabled={selectedJobIds.length === 0 && !isPaid || updatePayroll.isPending}
              >
                {updatePayroll.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
