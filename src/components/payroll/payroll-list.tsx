"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { usePayrolls, useDeletePayroll } from "@/hooks/use-payroll";
import { useWorker } from "@/hooks/use-workers";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Button } from "@/components/ui/button";
import { PayrollStatusBadge } from "@/components/status";
import { formatDateShort, formatCurrency } from "@/lib/format";
import { Trash2, FilterX, ChevronDown, Plus, Edit, CreditCard } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreatePayrollDialog } from "@/components/payroll/create-payroll-dialog";
import { UpdatePayrollDialog } from "@/components/payroll/update-payroll-dialog";
import { AddPayrollPaymentDialog } from "@/components/payroll/add-payroll-payment-dialog";
import type { Payroll_Sheet, Worker, Advance_Payment, DailyMachineWorker } from "@prisma/client";

type PayrollWithRelations = Payroll_Sheet & {
  worker?: Worker;
  adjustment?: any; // Decimal
  notes?: string | null;
  daily_workers?: DailyMachineWorker[];
  advance_payments?: Advance_Payment[];
};

interface PayrollListProps {
  workerId?: string;
  workerName?: string;
}

export function PayrollList({ workerId, workerName }: PayrollListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Data fetching logic
  const { data: allPayrolls, isLoading: isLoadingAll } = usePayrolls();
  const { data: workerData, isLoading: isLoadingWorker } = useWorker(workerId || "");

  const payrolls = workerId 
    ? (workerData?.payroll_sheets as unknown as PayrollWithRelations[])
    : allPayrolls as PayrollWithRelations[];

  const isLoading = workerId ? isLoadingWorker : isLoadingAll;

  // Hooks and State
  const deletePayroll = useDeletePayroll();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<string | null>(null);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [payrollToEdit, setPayrollToEdit] = useState<PayrollWithRelations | null>(null);

  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [payingPayroll, setPayingPayroll] = useState<PayrollWithRelations | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) || []
  );

  const handleResetFilters = () => {
    setStatusFilter([]);
  };

  const hasActiveFilters = statusFilter.length > 0;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
        
    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    else params.delete("status");
    
    // Preserve other params like tab
    const currentTab = searchParams.get("tab");
    if(currentTab) params.set("tab", currentTab);
    
    const queryString = params.toString();
    const currentQueryString = searchParams.toString();
    
    if (queryString !== currentQueryString) {
      router.replace(`${pathname}?${queryString}`, { scroll: false });
    }
  }, [statusFilter, searchParams, router, pathname]);

  const handleDeleteClick = (payrollId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayrollToDelete(payrollId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (payrollToDelete) {
      await deletePayroll.mutateAsync(payrollToDelete);
      setDeleteDialogOpen(false);
      setPayrollToDelete(null);
    }
  };

  const handleEditClick = (item: PayrollWithRelations, e: React.MouseEvent) => {
      e.stopPropagation();
      let itemToEdit = item;
      if (!item.worker && workerId && workerData) {
           // If worker is missing (e.g. in worker detail view), attach current worker data
           // We need to cast because workerData might have extra fields, but it satisfies Worker interface
           itemToEdit = { ...item, worker: workerData as unknown as Worker };
      }
      setPayrollToEdit(itemToEdit);
      setEditDialogOpen(true);
  }

  // Filter and Sort data
  const filteredData = useMemo(() => {
    if (!payrolls) return [];
    
    let result = [...payrolls];

    // Filter by status
    if (statusFilter.length > 0) {
      result = result.filter(item => statusFilter.includes(item.status));
    }
    
    if (!workerId) {
        // Global list: usually sorted by created_at desc already, but ensuring
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
        // Worker detail: sort by created desc
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [payrolls, statusFilter, workerId]);

  const columns: ColumnDef<PayrollWithRelations>[] = [
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "120px",
      render: (item) => (
        <span className="text-sm">
          {formatDateShort(new Date(item.created_at))}
        </span>
      ),
    },
    // 2. Worker Name (Only if !workerId)
    ...(!workerId ? [{
        key: "worker",
        label: "Công nhân",
        width: "200px",
        render: (item: PayrollWithRelations) => (
            <span className="font-medium">{item.worker?.name || "—"}</span>
        ),
    }] : []),
    // 3, 4, 5. Wages, Adv, Adjustment (Only if workerId)
    ...(workerId ? [
        {
            key: "total_wages",
            label: "Tổng lương",
            align: "right" as const,
            width: "150px",
            render: (item: PayrollWithRelations) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">
                    {formatCurrency(Number(item.total_wages))}
                </span>
            ),
        },
        {
            key: "total_adv",
            label: "Tạm ứng",
            align: "right" as const,
            width: "150px",
            render: (item: PayrollWithRelations) => (
                <span className="font-medium text-orange-600 dark:text-orange-400">
                    {formatCurrency(Number(item.total_adv))}
                </span>
            ),
        },
        {
            key: "adjustment",
            label: "Điều chỉnh",
            align: "right" as const,
            width: "150px",
            render: (item: PayrollWithRelations) => (
                <span className="font-medium text-purple-600 dark:text-purple-400">
                    {formatCurrency(Number(item.adjustment || 0))}
                </span>
            ),
        },
    ] : []),
    {
      key: "net_payable",
      label: "Thực nhận",
      align: "right" as const,
      width: "150px",
      render: (item) => (
        <span className="font-bold text-green-600 dark:text-green-400">
          {formatCurrency(Number(item.net_payable))}
        </span>
      ),
    },
    {
        key: "total_paid",
        label: "Đã trả",
        align: "right" as const,
        width: "150px",
        render: (item) => (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            {formatCurrency(Number(item.total_paid))}
          </span>
        ),
    },
    {
        key: "remaining",
        label: "Còn lại",
        align: "right" as const,
        width: "150px",
        render: (item) => {
            const remaining = Number(item.net_payable) - Number(item.total_paid);
            return (
                <span className={remaining > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {formatCurrency(remaining)}
                </span>
            )
        },
    },
    {
        key: "notes",
        label: "Ghi chú",
        render: (item) => (
            <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={item.notes || ""}>
                {item.notes || "—"}
            </span>
        ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "140px",
      align: "center" as const,
      render: (item: PayrollWithRelations) => <PayrollStatusBadge status={item.status as any} />,
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      align: "right" as const, 
      render: (item: PayrollWithRelations) => {
        const totalPaid = Number(item.total_paid);
        const canEditOrDelete = totalPaid === 0;
        const isCompleted = item.status === "COMPLETED"; // Or check balance <= 0
        
        return (
          <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                           e.stopPropagation();
                           setPayingPayroll(item);
                           setAddPaymentDialogOpen(true);
                        }}
                        disabled={isCompleted}
                      >
                         <CreditCard className={`h-4 w-4 ${isCompleted ? "text-muted-foreground" : "text-green-600"}`} />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCompleted ? "Phiếu lương đã thanh toán đầy đủ" : "Thêm thanh toán"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                 variant="ghost"
                 size="sm"
                 onClick={(e) => handleEditClick(item, e)}
               >
                 <Edit className="h-4 w-4" />
               </Button>
              
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => canEditOrDelete && handleDeleteClick(item.id, e)}
                          disabled={!canEditOrDelete}
                          className={!canEditOrDelete ? "opacity-50 cursor-not-allowed" : ""}
                      >
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canEditOrDelete && (
                    <TooltipContent>
                      <p>Phiếu lương đã có thanh toán nên không thể xoá</p>
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
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
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
                    { value: "PENDING", label: "Chưa thanh toán" },
                    { value: "PARTIAL_PAID", label: "Thanh toán 1 phần" }, // Check Enum value match
                    { value: "COMPLETED", label: "Hoàn thành" },
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

          {workerId && (
            <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo phiếu lương
            </Button>
         )}
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        getRowId={(item) => item.id}
        emptyMessage="Chưa có phiếu lương nào"
        onRowClick={(item) => router.push(`/payroll/${item.id}`)}
      />

      {/* Delete Payroll Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phiếu lương này? Hành động này không thể hoàn tác.
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
      
      <CreatePayrollDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        workerId={workerId}
      />
      
      {payrollToEdit && (
        <UpdatePayrollDialog 
            open={editDialogOpen} 
            onOpenChange={setEditDialogOpen}
            // @ts-ignore
            payroll={payrollToEdit}
        />
      )}

      {payingPayroll && (
        <AddPayrollPaymentDialog
          open={addPaymentDialogOpen}
          onOpenChange={(open) => {
             setAddPaymentDialogOpen(open);
             if(!open) setPayingPayroll(null);
          }}
          payroll={payingPayroll}
        />
      )}
    </div>
  );
}
