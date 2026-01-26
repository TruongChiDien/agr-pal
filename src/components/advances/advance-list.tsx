"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAdvancePayments, useDeleteAdvancePayment } from "@/hooks/use-advances";
import { useWorker } from "@/hooks/use-workers";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Button } from "@/components/ui/button";
import { AdvanceStatusBadge } from "@/components/status";
import { formatDateShort, formatCurrency } from "@/lib/format";
import { Trash2, FilterX, ChevronDown, Plus, Edit } from "lucide-react";
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
import { AdvancePaymentDialog } from "@/components/workers/advance-payment-dialog";
import type { Advance_Payment, Worker } from "@prisma/client";

type AdvanceWithRelations = Advance_Payment & {
  worker?: Worker;
};

interface AdvanceListProps {
  workerId?: string;
  workerName?: string;
}

export function AdvanceList({ workerId, workerName }: AdvanceListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Data fetching logic
  const { data: allAdvances, isLoading: isLoadingAll } = useAdvancePayments({ enabled: !workerId });
  const { data: workerData, isLoading: isLoadingWorker } = useWorker(workerId || "");

  const advances = workerId 
    ? (workerData?.advance_payments as unknown as AdvanceWithRelations[])
    : allAdvances as AdvanceWithRelations[];

  const isLoading = workerId ? isLoadingWorker : isLoadingAll;

  // Hooks and State
  const deleteAdvance = useDeleteAdvancePayment();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<any>(null);

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

  const handleDeleteClick = (advanceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvanceToDelete(advanceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (advanceToDelete) {
      await deleteAdvance.mutateAsync(advanceToDelete);
      setDeleteDialogOpen(false);
      setAdvanceToDelete(null);
    }
  };

  const handleEditClick = (advance: AdvanceWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAdvance(advance);
    setDialogOpen(true);
  };
  
  const handleCreateClick = () => {
    setEditingAdvance(null);
    setDialogOpen(true);
  };

  // Filter and Sort data
  const filteredData = useMemo(() => {
    if (!advances) return [];
    
    let result = [...advances];

    // Filter by status
    if (statusFilter.length > 0) {
      result = result.filter(item => statusFilter.includes(item.status));
    }

    // Default Sort by Created Date (Desc)
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [advances, statusFilter]);

  const columns: ColumnDef<AdvanceWithRelations>[] = [
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
    // Conditionally add Worker column if no workerId
    ...(!workerId ? [{
        key: "worker",
        label: "Công nhân",
        render: (item: AdvanceWithRelations) => (
            <span className="font-medium">{item.worker?.name || "—"}</span>
        ),
    }] : []),
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
      key: "amount",
      label: "Số tiền",
      align: "right" as const, // Explicit align
      width: "150px",
      render: (item: AdvanceWithRelations) => (
        <span className="font-medium text-primary">
          {formatCurrency(Number(item.amount))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "140px",
      align: "center" as const, // Explicit align
      render: (item: AdvanceWithRelations) => <AdvanceStatusBadge status={item.status as any} />,
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      align: "right" as const, 
      render: (item: AdvanceWithRelations) => {
        // Can delete if NO payroll_id (or status != PROCESSED)
        const canDelete = !item.payroll_id; // Assuming payroll_id check is sufficient/better
        
        return (
          <div className="flex items-center gap-1">
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
                    <span tabIndex={0}> {/* Wrapper for disabled button to capture hover */}
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => canDelete && handleDeleteClick(item.id, e)}
                          disabled={!canDelete}
                          className={!canDelete ? "opacity-50 cursor-not-allowed" : ""}
                      >
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canDelete && (
                    <TooltipContent>
                      <p>Tạm ứng đã được thêm vào phiếu lương nên không thể xoá</p>
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
                    { value: "UNPROCESSED", label: "Chưa xử lý" },
                    { value: "PROCESSED", label: "Đã xử lý" },
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
            <Button onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo tạm ứng
            </Button>
         )}
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        getRowId={(item) => item.id}
        emptyMessage="Chưa có tạm ứng nào"
      />

      {/* Delete Advance Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khoản tạm ứng này? Hành động này không thể hoàn tác.
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
      
      {workerId && (
        <AdvancePaymentDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            workerId={workerId}
            workerName={workerName || ""}
            initialData={editingAdvance}
        />
      )}
    </div>
  );
}
