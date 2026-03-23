"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Advance_Payment, DailyMachineWorker } from "@prisma/client";

interface PayrollPreviewProps {
  workerId: string;
  selectedJobIds: string[];
  selectedAdvanceIds: string[];
  adjustment?: number;
  // Source data typically passed from Selectors
  sourceJobs?: DailyMachineWorker[];
  sourceAdvances?: Advance_Payment[];
}

export function PayrollPreview({
  workerId,
  selectedJobIds,
  selectedAdvanceIds,
  adjustment = 0,
  sourceJobs = [],
  sourceAdvances = [],
}: PayrollPreviewProps) {
  
  // Calculate totals based on source data and selection
  const { totalWages, totalAdvances, netPayable } = useMemo(() => {
     // Filter jobs: active if ID is in selectedJobIds
     // Note: we rely on sourceJobs to contain all relevant jobs (Pending + Current).
     // Selectors ensure this.
     
     const activeJobs = sourceJobs.filter(job => selectedJobIds.includes(job.id));
     const totalWagesVal = activeJobs.reduce((sum, job) => sum + Number((job as any).final_pay || 0), 0);
     
     const activeAdvances = sourceAdvances.filter(adv => selectedAdvanceIds.includes(adv.id));
     const totalAdvancesVal = activeAdvances.reduce((sum, adv) => sum + Number(adv.amount), 0);
     
     const netPayableVal = totalWagesVal - totalAdvancesVal + adjustment;
     
     return {
         totalWages: totalWagesVal,
         totalAdvances: totalAdvancesVal,
         netPayable: netPayableVal
     };
  }, [sourceJobs, sourceAdvances, selectedJobIds, selectedAdvanceIds, adjustment]);


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

          {/* Adjustment */}
          {adjustment !== 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Điều chỉnh:</span>
              <span className={`text-lg font-semibold ${adjustment > 0 ? "text-purple-600 dark:text-purple-400" : "text-destructive"}`}>
                {adjustment > 0 ? "+" : ""} {formatCurrency(adjustment)}
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
