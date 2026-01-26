"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { Job, Booking, Customer, Land, Service, Job_Type } from "@prisma/client";

interface JobWorkerSelectorProps {
  workerId: string;
  selectedJobIds: string[];
  onSelectionChange: (jobIds: string[]) => void;
  payrollId?: string;
  isPaid?: boolean;
  onLoaded?: (jobs: Job[]) => void;
}

type JobWithRelations = Job & {
  booking: Booking & {
    customer: Customer;
    land: Land | null;
    service: Service;
  };
  job_type: Job_Type;
};

export function JobWorkerSelector({
  workerId,
  selectedJobIds,
  onSelectionChange,
  payrollId,
  isPaid,
  onLoaded,
}: JobWorkerSelectorProps) {
  const [jobs, setJobs] = useState<JobWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  const fetchJobs = async () => {
      if (!workerId) return;

      setIsLoading(true);
      try {
        let url = `/api/jobs?worker_id=${workerId}`;
        
        if (isPaid && payrollId) {
             // Strict mode: Only fetch jobs in this payroll
             url += `&include_payroll_id=${payrollId}`;
             // No payment_status param implies we rely on payroll_id
        } else {
             // Unpaid mode: Pending + (Optional) Current Payroll
             url += `&payment_status=PENDING_PAYROLL`;
             if (payrollId) {
                 url += `&include_payroll_id=${payrollId}`;
             }
        }
        
        const response = await fetch(url);
        const data = await response.json();
        const loadedJobs = data || [];
        setJobs(loadedJobs);
        if (onLoaded) onLoaded(loadedJobs);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [workerId, payrollId, isPaid]);

  const handleToggle = (jobId: string) => {
    if (selectedJobIds.includes(jobId)) {
      onSelectionChange(selectedJobIds.filter((id) => id !== jobId));
    } else {
      onSelectionChange([...selectedJobIds, jobId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedJobIds.length === jobs.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(jobs.map((job) => job.id));
    }
  };

  const totalPay = jobs
    .filter((job) => selectedJobIds.includes(job.id))
    .reduce((sum, job) => sum + Number(job.final_pay), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full justify-center items-center p-4">
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 pb-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold leading-none tracking-tight">Công việc ({jobs.length})</h3>
          {jobs.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-primary hover:underline"
            >
              {selectedJobIds.length === jobs.length
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Không có công việc nào chờ tính lương
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Công việc đã hoàn thành sẽ hiển thị ở đây
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  selectedJobIds.includes(job.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={selectedJobIds.includes(job.id)}
                  onCheckedChange={() => handleToggle(job.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {job.booking.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.booking.service.name} - {job.job_type.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(job.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(Number(job.final_pay))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Number(job.actual_qty)} {job.booking.service.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total Preview */}

          </div>
        )}
      </div>
    </div>
  );
}
