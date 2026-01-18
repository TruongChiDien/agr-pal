"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { formatCurrency, formatDateShort } from "@/lib/format";
import type { BillPayment } from "@prisma/client";

interface BillPaymentHistoryProps {
  payments: BillPayment[];
}

// Map payment method to label
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

export function BillPaymentHistory({ payments }: BillPaymentHistoryProps) {
  const paymentColumns: ColumnDef<BillPayment>[] = [
    {
      key: "payment_date",
      label: "Ngày thanh toán",
      width: "140px",
      render: (item) => (
        <span className="text-sm font-medium">
          {formatDateShort(item.payment_date)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Số tiền",
      align: "right",
      width: "160px",
      render: (item) => (
        <span className="text-sm font-bold text-green-600">
          {formatCurrency(Number(item.amount))}
        </span>
      ),
    },
    {
      key: "method",
      label: "Phương thức",
      width: "140px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {getPaymentMethodLabel(item.method)}
        </span>
      ),
    },
    {
      key: "notes",
      label: "Ghi chú",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.notes || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "140px",
      render: (item) => (
        <span className="text-xs text-muted-foreground">
          {formatDateShort(item.created_at)}
        </span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử thanh toán ({payments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Chưa có thanh toán nào
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Các khoản thanh toán sẽ được hiển thị tại đây
            </p>
          </div>
        ) : (
          <DataTable
            columns={paymentColumns}
            data={payments}
            currentPage={1}
            pageSize={100}
            totalPages={1}
            totalItems={payments.length}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            sortKey=""
            sortDirection={null}
            onSort={() => {}}
            getRowId={(item) => item.id}
            emptyMessage="Không có thanh toán"
            emptyDescription=""
          />
        )}
      </CardContent>
    </Card>
  );
}
