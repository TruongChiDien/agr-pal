"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { Payroll_Payment } from "@prisma/client";

interface PayrollPaymentHistoryProps {
  payments: Payroll_Payment[];
}

// Map payment method to Vietnamese label
function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case "CASH":
      return "Tiền mặt";
    case "BANK_TRANSFER":
      return "Chuyển khoản";
    default:
      return method;
  }
}

export function PayrollPaymentHistory({ payments }: PayrollPaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có thanh toán nào
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử thanh toán ({payments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div
              key={payment.id}
              className="flex items-start justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">
                    Thanh toán #{index + 1}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {getPaymentMethodLabel(payment.method)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(payment.payment_date)}
                </p>
                {payment.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {payment.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(Number(payment.amount))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(payment.created_at)}
                </p>
              </div>
            </div>
          ))}

          {/* Total Paid Summary */}
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Tổng đã trả ({payments.length} lần):
              </span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(
                  payments.reduce((sum, p) => sum + Number(p.amount), 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
