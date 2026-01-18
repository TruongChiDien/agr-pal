"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBills, useDeleteBill } from "@/hooks/use-bills";
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
import { BillStatus } from "@/types/enums";
import type { Bill, Customer } from "@prisma/client";

type BillWithRelations = Bill & {
  customer: Customer;
};

// Map bill status to badge variant
function getBillStatusVariant(
  status: string
): "open" | "partial" | "completed" {
  switch (status) {
    case BillStatus.Open:
      return "open";
    case BillStatus.PartialPaid:
      return "partial";
    case BillStatus.Completed:
      return "completed";
    default:
      return "open";
  }
}

// Map bill status to label
function getBillStatusLabel(status: string): string {
  switch (status) {
    case BillStatus.Open:
      return "Chưa thu";
    case BillStatus.PartialPaid:
      return "Thu 1 phần";
    case BillStatus.Completed:
      return "Hoàn thành";
    default:
      return status;
  }
}

export default function BillsPage() {
  const router = useRouter();
  const { data: bills, isLoading } = useBills();
  const deleteBill = useDeleteBill();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey("");
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleDeleteClick = (billId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBillToDelete(billId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (billToDelete) {
      await deleteBill.mutateAsync(billToDelete);
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  // Sort data
  const sortedData = bills
    ? [...bills].sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;

        let aValue: any;
        let bValue: any;

        // Special handling for nested fields
        if (sortKey === "customer") {
          aValue = a.customer.name;
          bValue = b.customer.name;
        } else if (sortKey === "balance") {
          aValue = Number(a.total_amount) - Number(a.total_paid);
          bValue = Number(b.total_amount) - Number(b.total_paid);
        } else {
          aValue = (a as any)[sortKey];
          bValue = (b as any)[sortKey];
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === "asc"
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue, "vi-VN")
            : bValue.localeCompare(aValue, "vi-VN");
        }

        return 0;
      })
    : [];

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const columns: ColumnDef<BillWithRelations>[] = [
    {
      key: "customer",
      label: "Khách hàng",
      sortable: true,
      render: (item) => <span className="font-medium">{item.customer.name}</span>,
    },
    {
      key: "total_amount",
      label: "Tổng tiền",
      align: "right",
      width: "140px",
      sortable: true,
      render: (item) => (
        <span className="font-semibold">
          {formatCurrency(Number(item.total_amount))}
        </span>
      ),
    },
    {
      key: "total_paid",
      label: "Đã thu",
      align: "right",
      width: "140px",
      sortable: true,
      render: (item) => (
        <span className="text-muted-foreground">
          {formatCurrency(Number(item.total_paid))}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Còn lại",
      align: "right",
      width: "140px",
      sortable: true,
      render: (item) => {
        const balance = Number(item.total_amount) - Number(item.total_paid);
        return (
          <span className={balance > 0 ? "font-bold text-destructive" : "text-muted-foreground"}>
            {formatCurrency(balance)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "130px",
      render: (item) => (
        <StatusBadge
          variant={getBillStatusVariant(item.status)}
          label={getBillStatusLabel(item.status)}
        />
      ),
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "120px",
      sortable: true,
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
      align: "right",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/bills/${item.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(item.id, e)}
            disabled={item.status !== BillStatus.Open}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Hóa đơn" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Hóa đơn"
        description="Quản lý hóa đơn và theo dõi công nợ khách hàng"
        actions={
          <Button onClick={() => router.push("/bills/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo hóa đơn
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={paginatedData}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={Math.ceil(sortedData.length / pageSize)}
          totalItems={sortedData.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          getRowId={(item) => item.id}
          onRowClick={(item) => router.push(`/bills/${item.id}`)}
          emptyMessage="Chưa có hóa đơn"
          emptyDescription="Tạo hóa đơn đầu tiên để bắt đầu"
        />
      </ContentSection>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
