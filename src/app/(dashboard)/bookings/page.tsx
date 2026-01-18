"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookings, useDeleteBooking } from "@/hooks/use-bookings";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { formatCurrency } from "@/lib/format";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingStatus, PaymentStatus } from "@/types/enums";
import type { Booking, Customer, Land, Service } from "@prisma/client";

type BookingWithRelations = Booking & {
  customer: Customer;
  land: Land | null;
  service: Service;
};

// Map status enum to badge variant
function getBookingStatusVariant(
  status: string
): "new" | "in-progress" | "completed" | "blocked" | "canceled" {
  switch (status) {
    case BookingStatus.New:
      return "new";
    case BookingStatus.InProgress:
      return "in-progress";
    case BookingStatus.Completed:
      return "completed";
    case BookingStatus.Blocked:
      return "blocked";
    case BookingStatus.Canceled:
      return "canceled";
    default:
      return "new";
  }
}

// Map payment status to badge variant
function getPaymentStatusVariant(
  status: string
): "pending" | "partial" | "paid" {
  switch (status) {
    case PaymentStatus.PendingBill:
      return "pending";
    case PaymentStatus.AddedBill:
      return "partial";
    case PaymentStatus.FullyPaid:
      return "paid";
    default:
      return "pending";
  }
}

// Map payment status to label
function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case PaymentStatus.PendingBill:
      return "Chưa tạo HĐ";
    case PaymentStatus.AddedBill:
      return "Đã tạo HĐ";
    case PaymentStatus.FullyPaid:
      return "Đã thanh toán";
    default:
      return status;
  }
}

// Map booking status to label
function getBookingStatusLabel(status: string): string {
  switch (status) {
    case BookingStatus.New:
      return "Mới";
    case BookingStatus.InProgress:
      return "Đang xử lý";
    case BookingStatus.Completed:
      return "Hoàn thành";
    case BookingStatus.Blocked:
      return "Bị chặn";
    case BookingStatus.Canceled:
      return "Đã hủy";
    default:
      return status;
  }
}

export default function BookingsPage() {
  const router = useRouter();
  const { data: bookings, isLoading } = useBookings();
  const deleteBooking = useDeleteBooking();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

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

  const handleDeleteClick = (bookingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookingToDelete(bookingId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (bookingToDelete) {
      await deleteBooking.mutateAsync(bookingToDelete);
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  // Sort data
  const sortedData = bookings
    ? [...bookings].sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;

        let aValue: any;
        let bValue: any;

        // Special handling for nested fields
        if (sortKey === "customer") {
          aValue = a.customer.name;
          bValue = b.customer.name;
        } else if (sortKey === "service") {
          aValue = a.service.name;
          bValue = b.service.name;
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

  const columns: ColumnDef<BookingWithRelations>[] = [
    {
      key: "customer",
      label: "Khách hàng",
      sortable: true,
      render: (item) => <span className="font-medium">{item.customer.name}</span>,
    },
    {
      key: "land",
      label: "Ruộng",
      width: "150px",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.land?.name || "—"}
        </span>
      ),
    },
    {
      key: "service",
      label: "Dịch vụ",
      sortable: true,
      width: "200px",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.service.name}</span>
          <span className="text-xs text-muted-foreground">
            {Number(item.quantity)} {item.service.unit}
          </span>
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Giá trị",
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
      key: "status",
      label: "Trạng thái",
      width: "130px",
      render: (item) => (
        <StatusBadge
          variant={getBookingStatusVariant(item.status)}
          label={getBookingStatusLabel(item.status)}
        />
      ),
    },
    {
      key: "payment_status",
      label: "Thanh toán",
      width: "140px",
      render: (item) => (
        <StatusBadge
          variant={getPaymentStatusVariant(item.payment_status)}
          label={getPaymentStatusLabel(item.payment_status)}
        />
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
              router.push(`/bookings/${item.id}/edit`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(item.id, e)}
            disabled={!!item.bill_id}
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
        <ContentSection title="Đơn hàng" description="Đang tải...">
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
        title="Đơn hàng"
        description="Quản lý đơn hàng và theo dõi trạng thái thanh toán"
        actions={
          <Button onClick={() => router.push("/bookings/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo đơn hàng
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
          onRowClick={(item) => router.push(`/bookings/${item.id}`)}
          emptyMessage="Chưa có đơn hàng"
          emptyDescription="Tạo đơn hàng đầu tiên để bắt đầu"
        />
      </ContentSection>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.
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
