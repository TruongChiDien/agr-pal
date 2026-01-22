"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJobs, useDeleteJob } from "@/hooks/use-jobs";
import { PageContainer, ContentSection } from "@/components/layout";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status/status-badge";
import { formatDateShort } from "@/lib/format";
import { Plus, Edit, Trash2, ExternalLink, FilterX, ChevronDown } from "lucide-react";
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
import type { Job, Job_Type, Machine, Booking, Customer, Land, Service, Worker, Payroll_Sheet } from "@prisma/client";

type JobWithRelations = Job & {
  booking: Booking & {
    customer: Customer;
    land: Land | null;
    service: Service;
  };
  job_type: Job_Type & {
    service: Service;
  };
  machine: Machine | null;
  worker: Worker;
  payroll: Payroll_Sheet | null;
};

function getJobStatusVariant(
  status: string
): "new" | "in-progress" | "completed" | "blocked" | "canceled" {
  switch (status) {
    case "NEW":
      return "new";
    case "IN_PROGRESS":
      return "in-progress";
    case "COMPLETED":
      return "completed";
    case "BLOCKED":
      return "blocked";
    case "CANCELED":
      return "canceled";
    default:
      return "new";
  }
}

function getJobStatusLabel(status: string): string {
  switch (status) {
    case "NEW":
      return "Mới";
    case "IN_PROGRESS":
      return "Đang xử lý";
    case "COMPLETED":
      return "Hoàn thành";
    case "BLOCKED":
      return "Bị chặn";
    case "CANCELED":
      return "Đã hủy";
    default:
      return status;
  }
}

function getPaymentStatusVariant(
  status: string
): "pending" | "partial" | "paid" {
  switch (status) {
    case "PENDING_PAYROLL":
      return "pending";
    case "ADDED_PAYROLL":
      return "partial";
    case "FULLY_PAID":
      return "paid";
    default:
      return "pending";
  }
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "PENDING_PAYROLL":
      return "Chưa tạo lương";
    case "ADDED_PAYROLL":
      return "Đã tạo lương";
    case "FULLY_PAID":
      return "Đã thanh toán";
    default:
      return status;
  }
}

export default function JobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: jobs, isLoading } = useJobs();
  const deleteJob = useDeleteJob();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

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
    const newUrl = queryString ? `/jobs?${queryString}` : "/jobs";
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

  const handleDeleteClick = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (jobToDelete) {
      await deleteJob.mutateAsync(jobToDelete);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  // Filter data by status filters
  const filteredData = jobs
    ? jobs.filter((job) => {
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(job.status);
        const matchesPaymentStatus = paymentStatusFilter.length === 0 || paymentStatusFilter.includes(job.payment_status);
        return matchesStatus && matchesPaymentStatus;
      })
    : [];

  // Sort data
  const sortedData = filteredData
    ? [...filteredData].sort((a, b) => {
        if (!sortKey || !sortDirection) return 0;

        let aValue: any;
        let bValue: any;

        // Special handling for nested fields
        if (sortKey === "worker") {
          aValue = a.worker.name;
          bValue = b.worker.name;
        } else if (sortKey === "job_type") {
          aValue = a.job_type.name;
          bValue = b.job_type.name;
        } else if (sortKey === "customer") {
          aValue = a.booking.customer.name;
          bValue = b.booking.customer.name;
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

  const columns: ColumnDef<JobWithRelations>[] = [
    {
      key: "created_at",
      label: "Ngày tạo",
      sortable: true,
      width: "110px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">{formatDateShort(item.created_at)}</span>
      ),
    },
    {
      key: "worker",
      label: "Công nhân",
      sortable: true,
      render: (item) => (
        <span className="font-medium">{item.worker.name}</span>
      ),
    },
    {
      key: "job_type",
      label: "Loại công việc",
      sortable: true,
      width: "180px",
      render: (item) => (
        <span className="font-medium">{item.job_type.name}</span>
      ),
    },
    {
      key: "customer",
      label: "Khách hàng",
      sortable: true,
      render: (item) => (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 font-medium"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/bookings/${item.booking.id}`);
          }}
        >
          {item.booking.customer.name}
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      width: "130px",
      render: (item) => (
        <StatusBadge
          variant={getJobStatusVariant(item.status)}
          label={getJobStatusLabel(item.status)}
        />
      ),
    },
    {
      key: "payment_status",
      label: "Thanh toán",
      sortable: true,
      width: "130px",
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
      render: (item) => {
        // Only show delete button if job is not completed, not fully paid, and not added to bill
        const canDelete =
          item.status !== "COMPLETED" &&
          item.payment_status == "PENDING_PAYROLL";

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/jobs/${item.id}/edit?redirect=${encodeURIComponent(`/jobs/${item.id}`)}`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteClick(item.id, e)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Công việc" description="Đang tải...">
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
        title="Công việc"
        description="Quản lý công việc và phân công công nhân"
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
                    { value: "NEW", label: "Mới" },
                    { value: "IN_PROGRESS", label: "Đang xử lý" },
                    { value: "COMPLETED", label: "Hoàn thành" },
                    { value: "BLOCKED", label: "Bị chặn" },
                    { value: "CANCELED", label: "Đã hủy" },
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
                    { value: "PENDING_PAYROLL", label: "Chưa tạo lương" },
                    { value: "ADDED_PAYROLL", label: "Đã tạo lương" },
                    { value: "FULLY_PAID", label: "Đã thanh toán" },
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
            <Button onClick={() => router.push("/jobs/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo công việc
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
          onRowClick={(item) => router.push(`/jobs/${item.id}`)}
          emptyMessage="Chưa có công việc"
          emptyDescription="Tạo công việc đầu tiên để bắt đầu"
        />
      </ContentSection>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.
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
