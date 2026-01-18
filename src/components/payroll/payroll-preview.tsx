"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Job, Advance_Payment } from "@prisma/client";

interface PayrollPreviewProps {
  workerId: string;
  selectedJobIds: string[];
  selectedAdvanceIds: string[];
}

export function PayrollPreview({
  workerId,
  selectedJobIds,
  selectedAdvanceIds,
}: PayrollPreviewProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [advances, setAdvances] = useState<Advance_Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedJobIds.length === 0) return;

      setIsLoading(true);
      try {
        // Fetch selected jobs
        const jobsResponse = await fetch(
          `/api/jobs?worker_id=${workerId}&payment_status=PENDING_PAYROLL`
        );
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.filter((job: Job) => selectedJobIds.includes(job.id)));

        // Fetch selected advances if any
        if (selectedAdvanceIds.length > 0) {
          const advancesResponse = await fetch(
            `/api/advances?worker_id=${workerId}&status=UNPROCESSED`
          );
          const advancesData = await advancesResponse.json();
          setAdvances(
            advancesData.filter((adv: Advance_Payment) =>
              selectedAdvanceIds.includes(adv.id)
            )
          );
        } else {
          setAdvances([]);
        }
      } catch (error) {
        console.error("Error fetching preview data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [workerId, selectedJobIds, selectedAdvanceIds]);

  const totalWages = jobs.reduce((sum, job) => sum + Number(job.final_pay), 0);
  const totalAdvances = advances.reduce(
    (sum, adv) => sum + Number(adv.amount),
    0
  );
  const netPayable = totalWages - totalAdvances;

  if (isLoading) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Đang tính toán...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <h3 className="text-sm font-medium mb-4">Tổng quan phiếu lương</h3>
        <div className="space-y-3">
          {/* Total Wages */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tổng lương:</span>
            <span className="text-lg font-semibold">
              {formatCurrency(totalWages)}
            </span>
          </div>

          {/* Total Advances */}
          {totalAdvances > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tạm ứng:</span>
              <span className="text-lg font-semibold text-destructive">
                - {formatCurrency(totalAdvances)}
              </span>
            </div>
          )}

          {/* Net Payable */}
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="text-sm font-medium">Thực nhận:</span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(netPayable)}
            </span>
          </div>

          {/* Summary */}
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {selectedJobIds.length} công việc
              {selectedAdvanceIds.length > 0 &&
                ` • ${selectedAdvanceIds.length} khoản tạm ứng`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
