"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { Job, Booking, Customer, Land, Service, Job_Type } from "@prisma/client";

interface JobWorkerSelectorProps {
  workerId: string;
  selectedJobIds: string[];
  onSelectionChange: (jobIds: string[]) => void;
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
}: JobWorkerSelectorProps) {
  const [jobs, setJobs] = useState<JobWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!workerId) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/jobs?worker_id=${workerId}&payment_status=PENDING_PAYROLL`
        );
        const data = await response.json();
        setJobs(data || []);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [workerId]);

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
      <Card>
        <CardHeader>
          <CardTitle>Công việc</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Đang tải...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Công việc ({jobs.length})</CardTitle>
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
      </CardHeader>
      <CardContent>
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
            {selectedJobIds.length > 0 && (
              <Card className="bg-muted/50 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Tổng lương ({selectedJobIds.length} công việc):
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(totalPay)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
