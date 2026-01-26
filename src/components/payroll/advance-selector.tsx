"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { Advance_Payment } from "@prisma/client";

interface AdvanceSelectorProps {
  workerId: string;
  selectedAdvanceIds: string[];
  onSelectionChange: (advanceIds: string[]) => void;
  payrollId?: string;
  isPaid?: boolean;
  onLoaded?: (advances: Advance_Payment[]) => void;
}

export function AdvanceSelector({
  workerId,
  selectedAdvanceIds,
  onSelectionChange,
  payrollId,
  isPaid,
  onLoaded,
}: AdvanceSelectorProps) {
  const [advances, setAdvances] = useState<Advance_Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAdvances = async () => {
      if (!workerId) return;

      setIsLoading(true);
      try {
        let url = `/api/advances?worker_id=${workerId}`;

        if (isPaid && payrollId) {
            url += `&include_payroll_id=${payrollId}`;
        } else {
            url += `&status=UNPROCESSED`;
            if (payrollId) {
                url += `&include_payroll_id=${payrollId}`;
            }
        }
        
        const response = await fetch(url);
        const data = await response.json();
        const loaded = data || [];
        setAdvances(loaded);
        if (onLoaded) onLoaded(loaded);
      } catch (error) {
        console.error("Error fetching advances:", error);
        setAdvances([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvances();
  }, [workerId, payrollId, isPaid]);

  const handleToggle = (advanceId: string) => {
    if (selectedAdvanceIds.includes(advanceId)) {
      onSelectionChange(selectedAdvanceIds.filter((id) => id !== advanceId));
    } else {
      onSelectionChange([...selectedAdvanceIds, advanceId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAdvanceIds.length === advances.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(advances.map((adv) => adv.id));
    }
  };

  const totalAdvances = advances
    .filter((adv) => selectedAdvanceIds.includes(adv.id))
    .reduce((sum, adv) => sum + Number(adv.amount), 0);

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
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Tạm ứng ({advances.length})</h3>
          </div>
          {advances.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-primary hover:underline"
            >
              {selectedAdvanceIds.length === advances.length
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {advances.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Không có khoản tạm ứng nào
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Có thể bỏ qua
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {advances.map((advance) => (
              <div
                key={advance.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  selectedAdvanceIds.includes(advance.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={selectedAdvanceIds.includes(advance.id)}
                  onCheckedChange={() => handleToggle(advance.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        #{advance.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(advance.created_at)}
                      </p>
                      {advance.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {advance.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">
                        - {formatCurrency(Number(advance.amount))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
