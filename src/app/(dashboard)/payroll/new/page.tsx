"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreatePayroll } from "@/hooks/use-payroll";
import { useWorkers } from "@/hooks/use-workers";
import { JobWorkerSelector } from "@/components/payroll/job-worker-selector";
import { AdvanceSelector } from "@/components/payroll/advance-selector";
import { PayrollPreview } from "@/components/payroll/payroll-preview";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPayrollSchema } from "@/schemas/payroll";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type CreatePayrollInput = z.infer<typeof createPayrollSchema>;

export default function CreatePayrollPage() {
  const router = useRouter();
  const createPayroll = useCreatePayroll();
  const { data: workers, isLoading: workersLoading } = useWorkers();
  const { toast } = useToast();

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<string[]>([]);

  const form = useForm<CreatePayrollInput>({
    resolver: zodResolver(createPayrollSchema),
    defaultValues: {
      worker_id: "",
      job_ids: [],
      advance_payment_ids: [],
    },
  });

  const selectedWorkerId = form.watch("worker_id");

  // Sync selected IDs with form fields
  useEffect(() => {
    form.setValue("job_ids", selectedJobIds);
  }, [selectedJobIds, form]);

  useEffect(() => {
    form.setValue("advance_payment_ids", selectedAdvanceIds);
  }, [selectedAdvanceIds, form]);

  // Reset selections when worker changes
  useEffect(() => {
    setSelectedJobIds([]);
    setSelectedAdvanceIds([]);
  }, [selectedWorkerId]);

  const onSubmit = async (data: CreatePayrollInput) => {
    if (selectedJobIds.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất 1 công việc",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        worker_id: data.worker_id,
        job_ids: selectedJobIds,
        advance_payment_ids: selectedAdvanceIds.length > 0 ? selectedAdvanceIds : undefined,
      };

      console.log("Creating payroll with payload:", payload);

      const result = await createPayroll.mutateAsync(payload);

      if (result.success) {
        toast({
          title: "Thành công",
          description: "Phiếu lương đã được tạo",
        });
        router.push("/payroll");
      } else {
        toast({
          title: "Lỗi",
          description: result.error || "Không thể tạo phiếu lương",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating payroll:", error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo phiếu lương",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer>
      <ContentSection
        title="Tạo phiếu lương"
        description="Tạo phiếu lương mới cho công nhân"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Worker Selection */}
            <FormField
              control={form.control}
              name="worker_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Công nhân *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn công nhân" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workersLoading ? (
                        <SelectItem value="loading" disabled>
                          Đang tải...
                        </SelectItem>
                      ) : !workers || workers.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Không có công nhân nào
                        </SelectItem>
                      ) : (
                        workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.name}
                            {worker.phone && ` - ${worker.phone}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Selection */}
            {selectedWorkerId && (
              <div className="space-y-4">
                <JobWorkerSelector
                  workerId={selectedWorkerId}
                  selectedJobIds={selectedJobIds}
                  onSelectionChange={setSelectedJobIds}
                />

                {/* Advance Payment Selection */}
                <AdvanceSelector
                  workerId={selectedWorkerId}
                  selectedAdvanceIds={selectedAdvanceIds}
                  onSelectionChange={setSelectedAdvanceIds}
                />

                {/* Payroll Preview */}
                {selectedJobIds.length > 0 && (
                  <PayrollPreview
                    workerId={selectedWorkerId}
                    selectedJobIds={selectedJobIds}
                    selectedAdvanceIds={selectedAdvanceIds}
                  />
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!selectedWorkerId || selectedJobIds.length === 0 || createPayroll.isPending}
                className="min-w-[120px]"
              >
                {createPayroll.isPending ? "Đang tạo..." : "Tạo phiếu lương"}
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
