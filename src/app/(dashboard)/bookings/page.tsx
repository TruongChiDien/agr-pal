"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookings, useDeleteBooking } from "@/hooks/use-bookings";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Plus, Edit, Trash2, FilterX, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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
  const searchParams = useSearchParams();
  const { data: bookings, isLoading } = useBookings();
  const deleteBooking = useDeleteBooking();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) || []
  );
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string[]>(
    searchParams.get("payment_status")?.split(",").filter(Boolean) || []
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    if (paymentStatusFilter.length > 0) params.set("payment_status", paymentStatusFilter.join(","));

    const queryString = params.toString();
    const newUrl = queryString ? `/bookings?${queryString}` : "/bookings";
    router.replace(newUrl, { scroll: false });
  }, [statusFilter, paymentStatusFilter, router]);

  const handleResetFilters = () => {
    setStatusFilter([]);
    setPaymentStatusFilter([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter.length > 0 || paymentStatusFilter.length > 0;

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

  // Filter data by status filters
  const filteredData = bookings
    ? bookings.filter((booking) => {
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(booking.status);
        const matchesPaymentStatus = paymentStatusFilter.length === 0 || paymentStatusFilter.includes(booking.payment_status);
        return matchesStatus && matchesPaymentStatus;
      })
    : [];

  // Sort data
  const sortedData = filteredData.sort((a, b) => {
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
  });

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const columns: ColumnDef<BookingWithRelations>[] = [
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "110px",
      sortable: true,
      render: (item) => (
        <span className="text-sm text-muted-foreground">{formatDateShort(item.created_at)}</span>
      ),
    },
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
              router.push(`/bookings/${item.id}/edit?redirect=${encodeURIComponent(`/bookings/${item.id}`)}`);
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
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                <FilterX className="h-4 w-4 mr-2" />
                Xóa bộ lọc
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  Trạng thái
                  {statusFilter.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {statusFilter.length}
                    </span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-popover z-[100]" align="start">
                <div className="p-2 space-y-2">
                  {[
                    { value: BookingStatus.New, label: "Mới" },
                    { value: BookingStatus.InProgress, label: "Đang xử lý" },
                    { value: BookingStatus.Completed, label: "Hoàn thành" },
                    { value: BookingStatus.Blocked, label: "Bị chặn" },
                    { value: BookingStatus.Canceled, label: "Đã hủy" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={statusFilter.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setStatusFilter([...statusFilter, option.value]);
                          } else {
                            setStatusFilter(statusFilter.filter((v) => v !== option.value));
                          }
                          setCurrentPage(1);
                        }}
                      />
                      <label
                        htmlFor={`status-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  Thanh toán
                  {paymentStatusFilter.length > 0 && (
                    <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                      {paymentStatusFilter.length}
                    </span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-popover z-[100]" align="start">
                <div className="p-2 space-y-2">
                  {[
                    { value: PaymentStatus.PendingBill, label: "Chưa tạo HĐ" },
                    { value: PaymentStatus.AddedBill, label: "Đã tạo HĐ" },
                    { value: PaymentStatus.FullyPaid, label: "Đã thanh toán" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`payment-${option.value}`}
                        checked={paymentStatusFilter.includes(option.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPaymentStatusFilter([...paymentStatusFilter, option.value]);
                          } else {
                            setPaymentStatusFilter(paymentStatusFilter.filter((v) => v !== option.value));
                          }
                          setCurrentPage(1);
                        }}
                      />
                      <label
                        htmlFor={`payment-${option.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={() => router.push("/bookings/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo đơn hàng
            </Button>
          </div>
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
