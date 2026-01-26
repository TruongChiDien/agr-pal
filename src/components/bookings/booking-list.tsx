"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useBookings, useDeleteBooking, useUpdateBooking, useUpdateBookingWithJobs } from "@/hooks/use-bookings";
import { useCustomer } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { StatusSelect } from "@/components/status/status-select";
import { StatusBadge } from "@/components/status/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Edit, Trash2, FilterX, ChevronDown, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { BookingStatus, PaymentStatus } from "@/types/enums";
import type { Booking, Customer, Land, Service } from "@prisma/client";
import { handleBookingStatusUpdate } from "@/lib/booking-status-utils";
import { UpdateBookingDialog } from "@/components/bookings/update-booking-dialog";
import { CreateBookingDialog } from "@/components/bookings/create-booking-dialog";

type BookingWithRelations = Booking & {
  customer: Customer;
  land: Land | null;
  service: Service;
};

// Status options for Select
const BOOKING_STATUS_OPTIONS = [
  { value: BookingStatus.New, label: "Mới", variant: "new" as const },
  { value: BookingStatus.InProgress, label: "Đang xử lý", variant: "in-progress" as const },
  { value: BookingStatus.Completed, label: "Hoàn thành", variant: "completed" as const },
  { value: BookingStatus.Blocked, label: "Bị chặn", variant: "blocked" as const },
  { value: BookingStatus.Canceled, label: "Đã hủy", variant: "canceled" as const },
];

function getPaymentStatusVariant(status: string): "pending" | "partial" | "paid" {
  switch (status) {
    case PaymentStatus.PendingBill: return "pending";
    case PaymentStatus.AddedBill: return "partial";
    case PaymentStatus.FullyPaid: return "paid";
    default: return "pending";
  }
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case PaymentStatus.PendingBill: return "Chưa tạo HĐ";
    case PaymentStatus.AddedBill: return "Đã tạo HĐ";
    case PaymentStatus.FullyPaid: return "Đã thanh toán";
    default: return status;
  }
}

interface BookingListProps {
  customerId?: string;
  onEdit?: (booking: BookingWithRelations) => void;
  onDelete?: (booking: BookingWithRelations) => void;
}

export function BookingList({ customerId, onEdit, onDelete }: BookingListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data fetching logic
  const { data: allBookings, isLoading: isLoadingAll } = useBookings({ enabled: !customerId });
  const { data: customerData, isLoading: isLoadingCustomer } = useCustomer(customerId || "");

  const rawBookings = customerId 
    ? (customerData?.bookings as unknown as BookingWithRelations[])
    : allBookings as BookingWithRelations[];

  const isLoading = customerId ? isLoadingCustomer : isLoadingAll;

  // Hooks and State
  const updateBooking = useUpdateBooking();
  const updateBookingWithJobs = useUpdateBookingWithJobs();
  const deleteBooking = useDeleteBooking();

  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) || []
  );
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string[]>(
    searchParams.get("payment_status")?.split(",").filter(Boolean) || []
  );

  // Update URL when filters change
  const pathname = usePathname();
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    else params.delete("status");
    
    if (paymentStatusFilter.length > 0) params.set("payment_status", paymentStatusFilter.join(","));
    else params.delete("payment_status");

    const queryString = params.toString();
    const currentQueryString = searchParams.toString();

    if (queryString !== currentQueryString) {
      router.replace(`${pathname}?${queryString}`, { scroll: false });
    }

  }, [statusFilter, paymentStatusFilter, searchParams, router, pathname]);

  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [jobConfirmDialogOpen, setJobConfirmDialogOpen] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{
    bookingId: string;
    newStatus: string;
  } | null>(null);
  const [incompleteJobCount, setIncompleteJobCount] = useState(0);
  
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingWithRelations | null>(null);
  
  const [createBookingDialogOpen, setCreateBookingDialogOpen] = useState(false);

  // Pagination and Sort State (Local)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

  // Handlers
  const handleSort = (key: string) => {
    if (sortKey === key) {
        if (sortDirection === "asc") setSortDirection("desc");
        else if (sortDirection === "desc") {
            setSortDirection(null);
            setSortKey("");
        } else setSortDirection("asc");
    } else {
        setSortKey(key);
        setSortDirection("asc");
    }
  };

  const handleStatusChange = async (booking: BookingWithRelations, newStatus: string) => {
    await handleBookingStatusUpdate({
      bookingId: booking.id,
      currentStatus: booking.status,
      newStatus,
      onNeedConfirmation: (jobCount) => {
        setPendingStatusUpdate({ bookingId: booking.id, newStatus });
        setIncompleteJobCount(jobCount);
        setJobConfirmDialogOpen(true);
      },
      onProceedWithoutJobs: async () => {
        updateBooking.mutate({ id: booking.id, data: { status: newStatus } });
      },
    });
  };

  const handleConfirmCompleteJobs = async () => {
    if (pendingStatusUpdate) {
      await updateBookingWithJobs.mutateAsync({
        id: pendingStatusUpdate.bookingId,
        data: { status: pendingStatusUpdate.newStatus },
        completeJobs: true,
      });
      setJobConfirmDialogOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  const handleDeclineCompleteJobs = async () => {
    if (pendingStatusUpdate) {
      await updateBookingWithJobs.mutateAsync({
        id: pendingStatusUpdate.bookingId,
        data: { status: pendingStatusUpdate.newStatus },
        completeJobs: false,
      });
      setJobConfirmDialogOpen(false);
      setPendingStatusUpdate(null);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter([]);
    setPaymentStatusFilter([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter.length > 0 || paymentStatusFilter.length > 0;

  // Filter Data
  const filteredBookings = rawBookings
    ? rawBookings.filter((booking) => {
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(booking.status);
        const matchesPaymentStatus = paymentStatusFilter.length === 0 || paymentStatusFilter.includes(booking.payment_status);
        return matchesStatus && matchesPaymentStatus;
      })
    : [];

  const handleDeleteClick = (booking: BookingWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
        onDelete(booking);
    } else {
        setBookingToDelete(booking.id);
        setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (bookingToDelete) {
      await deleteBooking.mutateAsync(bookingToDelete);
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  // Sorting
  const sortedData = filteredBookings
    ? [...filteredBookings].sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;
        const aValue = (a as any)[sortKey];
        const bValue = (b as any)[sortKey];

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

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Columns
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
    // Conditionally add Customer Column
    ...(customerId ? [] : [{
      key: "customer",
      label: "Khách hàng",
      width: "200px",
      render: (item: BookingWithRelations) => <span className="font-medium">{item.customer?.name}</span>,
    }]),
    {
      key: "service",
      label: "Dịch vụ",
      width: "200px",
      render: (item) => (
        <div className="flex flex-col">
            <span className="font-medium">{item.service?.name}</span>
            <span className="text-xs text-muted-foreground">
            {Number(item.quantity)} {item.service?.unit}
            </span>
        </div>
      ),
    },
    {
      key: "land",
      label: "Thửa ruộng",
      width: "200px",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.land?.name || "—"}
        </span>
      ),
    },
    {
      key: "notes",
      label: "Ghi chú",
      render: (item) => <span className="text-muted-foreground">{item.notes || "—"}</span>,
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
      key: "status",
      label: "Trạng thái",
      width: "130px",
      align: "center",
      render: (item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <StatusSelect
            value={item.status}
            options={BOOKING_STATUS_OPTIONS}
            onValueChange={(value) => handleStatusChange(item, value)}
            className="w-[120px]"
          />
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      align: "right",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(item);
              } else {
                setEditingBooking(item);
                setEditBookingDialogOpen(true);
              }
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {item.bill_id || item.status === BookingStatus.Completed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                      >
                         <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                        {item.bill_id
                          ? "Đơn hàng đã được tạo hóa đơn nên không thể xóa"
                          : "Đơn hàng đã hoàn thành nên không thể xóa"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteClick(item, e)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
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
            
            {customerId && (
                <Button onClick={() => setCreateBookingDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm đơn hàng
                </Button>
            )}
      </div>

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
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteBooking.isPending}>
              {deleteBooking.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Completion Confirmation Dialog */}
      <Dialog open={jobConfirmDialogOpen} onOpenChange={setJobConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành các công việc?</DialogTitle>
            <DialogDescription>
              Đơn hàng này có {incompleteJobCount} công việc chưa hoàn thành (trạng thái Mới hoặc Đang xử lý).
              <br />
              <br />
              Bạn có muốn đánh dấu tất cả các công việc này là Hoàn thành không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeclineCompleteJobs}
              disabled={updateBookingWithJobs.isPending}
            >
              Không, chỉ cập nhật đơn hàng
            </Button>
            <Button
              onClick={handleConfirmCompleteJobs}
              disabled={updateBookingWithJobs.isPending}
            >
              {updateBookingWithJobs.isPending ? "Đang cập nhật..." : "Có, hoàn thành tất cả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Booking Dialog */}
      {editingBooking && (
        <UpdateBookingDialog
          open={editBookingDialogOpen}
          onOpenChange={(open) => {
            setEditBookingDialogOpen(open);
            if (!open) setEditingBooking(null);
          }}
          booking={editingBooking}
        />
      )}
      
      {customerId && customerData && (
          <CreateBookingDialog
            open={createBookingDialogOpen}
            onOpenChange={setCreateBookingDialogOpen}
            customer={customerData as any}
          />
      )}
    </div>
  );
}

