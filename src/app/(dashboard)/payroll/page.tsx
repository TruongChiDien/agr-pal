"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePayrolls, useDeletePayroll } from "@/hooks/use-payroll";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Plus, Eye, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PayrollStatus } from "@/types/enums";
import type { Payroll_Sheet, Worker } from "@prisma/client";

type PayrollWithRelations = Payroll_Sheet & {
  worker: Worker;
};

// Map payroll status to badge variant
function getPayrollStatusVariant(
  status: string
): "open" | "partial" | "completed" {
  switch (status) {
    case PayrollStatus.Open:
      return "open";
    case PayrollStatus.PartialPaid:
      return "partial";
    case PayrollStatus.Completed:
      return "completed";
    default:
      return "open";
  }
}

// Map payroll status to label
function getPayrollStatusLabel(status: string): string {
  switch (status) {
    case PayrollStatus.Open:
      return "Chưa trả";
    case PayrollStatus.PartialPaid:
      return "Trả 1 phần";
    case PayrollStatus.Completed:
      return "Hoàn thành";
    default:
      return status;
  }
}

export default function PayrollListPage() {
  const router = useRouter();
  const { data: payrolls, isLoading } = usePayrolls();
  const deletePayroll = useDeletePayroll();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<string | null>(null);

  const handleDeleteClick = (payrollId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayrollToDelete(payrollId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!payrollToDelete) return;

    await deletePayroll.mutateAsync(payrollToDelete);
    setDeleteDialogOpen(false);
    setPayrollToDelete(null);
  };

  const columns: ColumnDef<PayrollWithRelations>[] = [
    {
      key: "worker",
      label: "Công nhân",
      width: "200px",
      render: (item) => (
        <div>
          <p className="text-sm font-medium">{item.worker.name}</p>
          {item.worker.phone && (
            <p className="text-xs text-muted-foreground">{item.worker.phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "total_wages",
      label: "Tổng lương",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-sm font-semibold">
          {formatCurrency(Number(item.total_wages))}
        </span>
      ),
    },
    {
      key: "total_adv",
      label: "Tạm ứng",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {formatCurrency(Number(item.total_adv))}
        </span>
      ),
    },
    {
      key: "net_payable",
      label: "Thực nhận",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-sm font-bold text-primary">
          {formatCurrency(Number(item.net_payable))}
        </span>
      ),
    },
    {
      key: "total_paid",
      label: "Đã trả",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-sm font-semibold text-green-600">
          {formatCurrency(Number(item.total_paid))}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Còn lại",
      align: "right",
      width: "140px",
      render: (item) => {
        const balance = Number(item.net_payable) - Number(item.total_paid);
        return (
          <span
            className={`text-sm font-bold ${
              balance > 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {formatCurrency(balance)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "120px",
      render: (item) => (
        <StatusBadge
          variant={getPayrollStatusVariant(item.status)}
          label={getPayrollStatusLabel(item.status)}
        />
      ),
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "120px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {formatDateShort(item.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/payroll/${item.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(item.id, e)}
            disabled={Number(item.total_paid) > 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Phiếu lương" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const payrollsData = (payrolls || []) as PayrollWithRelations[];

  return (
    <PageContainer>
      <ContentSection
        title="Phiếu lương"
        description="Quản lý phiếu lương công nhân"
        actions={
          <Button onClick={() => router.push("/payroll/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo phiếu lương
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={payrollsData}
          currentPage={1}
          pageSize={20}
          totalPages={1}
          totalItems={payrollsData.length}
          onPageChange={() => {}}
          onPageSizeChange={() => {}}
          sortKey=""
          sortDirection={null}
          onSort={() => {}}
          getRowId={(item) => item.id}
          onRowClick={(item) => router.push(`/payroll/${item.id}`)}
          emptyMessage="Không có phiếu lương nào"
          emptyDescription="Tạo phiếu lương đầu tiên để bắt đầu"
        />
      </ContentSection>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa phiếu lương</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phiếu lương này? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletePayroll.isPending}
            >
              {deletePayroll.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
