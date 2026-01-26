"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreatePayroll } from "@/hooks/use-payroll";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPayrollSchema } from "@/schemas/payroll";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type CreatePayrollInput = z.infer<typeof createPayrollSchema>;

interface CreatePayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId?: string;
}

export function CreatePayrollDialog({ open, onOpenChange, workerId }: CreatePayrollDialogProps) {
  const createPayroll = useCreatePayroll();
  const { data: workers, isLoading: workersLoading } = useWorkers();
  const { toast } = useToast();

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<string[]>([]);
  
  // Find worker object for display
  const worker = workers?.find(w => w.id === workerId);

  const form = useForm<any>({
    resolver: zodResolver(createPayrollSchema),
    mode: 'onBlur',
    defaultValues: {
      worker_id: workerId || "",
      job_ids: [],
      advance_payment_ids: [],
      adjustment: 0,
      notes: "",
    },
  });

  const selectedWorkerId = form.watch("worker_id");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        worker_id: workerId || "",
        job_ids: [],
        advance_payment_ids: [],
        adjustment: 0,
        notes: "",
      });
      setSelectedJobIds([]);
      setSelectedAdvanceIds([]);
    }
  }, [open, workerId, form]);

  useEffect(() => {
    if (workerId) {
        form.setValue("worker_id", workerId);
    }
  }, [workerId, form])

  // Sync selected IDs with form fields
  useEffect(() => {
    form.setValue("job_ids", selectedJobIds);
  }, [selectedJobIds, form]);

  useEffect(() => {
    form.setValue("advance_payment_ids", selectedAdvanceIds);
  }, [selectedAdvanceIds, form]);

  // Reset selections when worker changes (if manually changed)
  useEffect(() => {
    if (selectedWorkerId && selectedWorkerId !== workerId) {
        // Only reset if user manually changed worker (and it wasn't the prop update)
        // But logic is tricky. Simplest is: if workerId prop provided, prevent changing worker?
        // Or if changed, reset.
        // For now, if worker changes, reset selections
        // But initial load sets workerId, so check if we already had selection?
        // Let's just trust `selectedWorkerId`
    }
    // We handle reset in manual change Select onValueChange if needed, or effect.
    // Ideally if worker changes, everything resets.
  }, [selectedWorkerId]); 
  
  // Actually better to handle resets in the Select onChange handler or use key.
  
  const handleWorkerChange = (value: string) => {
      form.setValue("worker_id", value);
      setSelectedJobIds([]);
      setSelectedAdvanceIds([]);
  }

  const onSubmit = async (data: CreatePayrollInput) => {
    if (selectedJobIds.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất 1 công việc",
        variant: "destructive",
      });
      return;
    }

    const payload = {
        ...data,
        job_ids: selectedJobIds,
        advance_payment_ids: selectedAdvanceIds.length > 0 ? selectedAdvanceIds : undefined,
    };

    const result = await createPayroll.mutateAsync(payload);

    if (result.success) {
      onOpenChange(false);
      // Optional: Navigate to Detail page? Or just stay on list. 
      // If we are in List page, toast is enough.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo phiếu lương</DialogTitle>
          <DialogDescription>
            Tạo phiếu lương mới cho công nhân
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Simplified Worker Display */}
            {worker && (
                 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>Công nhân:</span>
                    <span className="font-medium text-foreground">{worker.name}</span>
                 </div>
            )}

            {/* Top Grid: Checklists */}
            {selectedWorkerId && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="border rounded-md p-4 flex flex-col h-[300px] md:h-[400px] bg-card shadow-sm">
                        <JobWorkerSelector
                            workerId={selectedWorkerId}
                            selectedJobIds={selectedJobIds}
                            onSelectionChange={setSelectedJobIds}
                        />
                     </div>
                     <div className="border rounded-md p-4 flex flex-col h-[300px] md:h-[400px] bg-card shadow-sm">
                        <AdvanceSelector
                            workerId={selectedWorkerId}
                            selectedAdvanceIds={selectedAdvanceIds}
                            onSelectionChange={setSelectedAdvanceIds}
                        />
                     </div>
                </div>
            )}
            
            {/* Adjustment Input (Full width) */}
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
                                onChange={e => field.onChange(Number(e.target.value))}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Summary Formula (Review) */}
            {selectedWorkerId && (
                <PayrollPreview
                    workerId={selectedWorkerId}
                    selectedJobIds={selectedJobIds}
                    selectedAdvanceIds={selectedAdvanceIds}
                    adjustment={form.watch("adjustment")} 
                />
            )}

            {/* Notes Input */}
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
                disabled={!selectedWorkerId || selectedJobIds.length === 0 || createPayroll.isPending}
              >
                {createPayroll.isPending ? "Đang tạo..." : "Tạo phiếu lương"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
