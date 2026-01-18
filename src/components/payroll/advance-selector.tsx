"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { Advance_Payment } from "@prisma/client";

interface AdvanceSelectorProps {
  workerId: string;
  selectedAdvanceIds: string[];
  onSelectionChange: (advanceIds: string[]) => void;
}

export function AdvanceSelector({
  workerId,
  selectedAdvanceIds,
  onSelectionChange,
}: AdvanceSelectorProps) {
  const [advances, setAdvances] = useState<Advance_Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAdvances = async () => {
      if (!workerId) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/advances?worker_id=${workerId}&status=UNPROCESSED`
        );
        const data = await response.json();
        setAdvances(data || []);
      } catch (error) {
        console.error("Error fetching advances:", error);
        setAdvances([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdvances();
  }, [workerId]);

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
      <Card>
        <CardHeader>
          <CardTitle>Tạm ứng (Tùy chọn)</CardTitle>
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
          <div>
            <CardTitle>Tạm ứng ({advances.length})</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Tùy chọn - Chọn các khoản tạm ứng để trừ vào lương
            </p>
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
      </CardHeader>
      <CardContent>
        {advances.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Không có khoản tạm ứng nào chưa xử lý
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bạn có thể bỏ qua bước này nếu không có tạm ứng
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
                        Tạm ứng #{advance.id.slice(0, 8)}
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

            {/* Total Preview */}
            {selectedAdvanceIds.length > 0 && (
              <Card className="bg-muted/50 border-destructive/20">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Tổng tạm ứng ({selectedAdvanceIds.length} khoản):
                    </span>
                    <span className="text-xl font-bold text-destructive">
                      - {formatCurrency(totalAdvances)}
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
