"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useJobs, useDeleteJob, useUpdateJob } from "@/hooks/use-jobs";
import { useWorker } from "@/hooks/use-workers";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status/status-badge";
import { StatusSelect } from "@/components/status/status-select";
import { formatDateShort } from "@/lib/format";
import { Edit, Trash2, FilterX, ChevronDown, Search } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UpdateJobDialog } from "@/components/jobs/update-job-dialog";
import type { Job, Job_Type, Machine, Booking, Customer, Land, Service, Worker, Payroll_Sheet } from "@prisma/client";

type JobWithRelations = Job & {
  booking: Booking & {
    customer: Customer;
    service: Service;
    land?: Land | null;
  };
  job_type: Job_Type & {
    service: Service;
  };
  machine?: Machine | null;
  worker: Worker;
  payroll?: Payroll_Sheet | null;
};

// Status options for Select
const JOB_STATUS_OPTIONS = [
  { value: "NEW", label: "Mới", variant: "new" as const },
  { value: "IN_PROGRESS", label: "Đang xử lý", variant: "in-progress" as const },
  { value: "COMPLETED", label: "Hoàn thành", variant: "completed" as const },
  { value: "BLOCKED", label: "Bị chặn", variant: "blocked" as const },
  { value: "CANCELED", label: "Đã hủy", variant: "canceled" as const },
];

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

interface JobListProps {
  workerId?: string;
  onEdit?: (job: JobWithRelations) => void;
  onDelete?: (job: JobWithRelations) => void;
}

export function JobList({ workerId, onEdit, onDelete }: JobListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Data fetching logic
  const { data: allJobs, isLoading: isLoadingAll } = useJobs({ enabled: !workerId });
  const { data: workerData, isLoading: isLoadingWorker } = useWorker(workerId || "");

  const jobs = workerId 
    ? (workerData?.jobs as unknown as JobWithRelations[])
    : allJobs as JobWithRelations[];

  const isLoading = workerId ? isLoadingWorker : isLoadingAll;

  // Hooks and State
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<any>(null); // Internal editing state

  const [searchQuery, setSearchQuery] = useState(""); // Local state for search
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

  const handleResetFilters = () => {
    setStatusFilter([]);
    setPaymentStatusFilter([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter.length > 0 || paymentStatusFilter.length > 0 || searchQuery.length > 0;

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

  const handleDeleteClick = (job: JobWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
        onDelete(job);
    } else {
        setJobToDelete(job.id);
        setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (jobToDelete) {
      await deleteJob.mutateAsync(jobToDelete);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

   // Filter data by status filters and search query
   const filteredData = useMemo(() => {
    return jobs
      ? jobs.filter((job) => {
          const matchesStatus = statusFilter.length === 0 || statusFilter.includes(job.status);
          const matchesPaymentStatus = paymentStatusFilter.length === 0 || paymentStatusFilter.includes(job.payment_status);
          const matchesSearch = !workerId ? (job.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) || job.booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) : job.booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase());
          // If workerId is present, we filter by customer name (since worker is fixed).
          // If workerId is NOT present, we filter by worker name AND customer name (as general search).
          // The user requirement: "Nếu không truyền worker_id thì thêm thanh search theo worker name (tham khảo page job list) còn không truyền thì thôi" implies search is ONLY for worker name when worker_id is missing?
          // "thêm thanh search theo worker name... còn không truyền thì thôi" -> means if worker_id is present, NO SEARCH BAR?
          // Or if worker_id is NOT present, search bar searches worker name.
          // Let's assume general search is useful.
          // But strict reading: "Nếu không truyền worker_id thì thêm thanh search theo worker name... còn không truyền [worker_id] thì thôi" -> wait, "còn không truyền thì thôi" (else omit it).
          // Meaning: Show Search (Worker Name) ONLY IF !workerId.
          // If workerId is present, DO NOT SHOW SEARCH BAR at all?
          // I will follow this logic. Search bar visibility depends on !workerId.
          // Filter logic: if search bar visible, filter by worker name.
          
          if (workerId) return matchesStatus && matchesPaymentStatus;
          
          const matchesSearchWorker = job.worker.name.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesStatus && matchesPaymentStatus && (searchQuery ? matchesSearchWorker : true);
        })
      : [];
  }, [jobs, statusFilter, paymentStatusFilter, searchQuery, workerId]);

  // Sort data
  const sortedData = useMemo(() => {
    return filteredData
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
  }, [filteredData, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  const columns: ColumnDef<JobWithRelations>[] = [
    {
      key: "created_at",
      label: "Ngày tạo",
      sortable: true,
      align: "left",
      width: "110px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">{formatDateShort(item.created_at)}</span>
      ),
    },
    // Conditionally add Worker column
    ...(!workerId ? [{
        key: "worker",
        label: "Công nhân",
        align: "left" as const,
        render: (item: JobWithRelations) => (
            <span className="font-medium">{item.worker.name}</span>
        ),
    }] : []),
    {
      key: "job_type",
      label: "Loại công việc",
      width: "180px",
      align: "left",
      render: (item) => (
        <span className="font-medium">{item.job_type.name}</span>
      ),
    },
    {
      key: "customer",
      label: "Khách hàng",
      align: "left",
      render: (item) => (
        <span className="font-medium">{item.booking.customer.name}</span>
      ),
    },
    {
        key: "machine",
        label: "Máy",
        align: "left",
        render: (item) => (
          <span className="text-muted-foreground">{item.machine?.name || "—"}</span>
        ),
    },
    {
        key: "notes",
        label: "Ghi chú",
        align: "left",
        render: (item) => (
          <span className="text-muted-foreground">{item.notes || "—"}</span>
        ),
    },
    {
      key: "payment_status",
      label: "Thanh toán",
      width: "140px",
      align: "center",
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
        <StatusSelect
          value={item.status}
          options={JOB_STATUS_OPTIONS}
          onValueChange={(value) => {
            updateJob.mutate({ id: item.id, data: { status: value } });
          }}
          className="w-[120px]"
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
                if (onEdit) {
                    onEdit(item);
                } else {
                    setEditingJob(item);
                }
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span tabIndex={0}> {/* Wrapper for disabled button to capture hover */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(item, e)}
                      disabled={!canDelete}
                      className={!canDelete ? "opacity-50 pointer-events-none" : ""}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canDelete && (
                  <TooltipContent>
                    <p>Công việc đã có phiếu lương hoặc đã hoàn thành, không thể xóa</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
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
    <>
      <div className="flex gap-2 justify-end mb-4">
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
            
            {!workerId && (
                <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm công nhân..."
                    value={searchQuery}
                    onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); 
                    }}
                    className="pl-8 w-[250px]"
                />
                </div>
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
        onRowClick={(item) => router.push(`/jobs/${item.id}`)}
        emptyMessage="Chưa có công việc"
        emptyDescription="Tạo công việc đầu tiên để bắt đầu"
      />

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
      
      {editingJob && (
        <UpdateJobDialog
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          job={editingJob}
        />
      )}
    </>
  );
}
