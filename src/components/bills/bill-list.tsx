"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useBills, useDeleteBill } from "@/hooks/use-bills";
import { useCustomer } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { StatusBadge } from "@/components/status/status-badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Edit, Trash2, FilterX, ChevronDown, Plus, CreditCard } from "lucide-react";
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
import { BillStatus } from "@/types/enums";
import type { Bill, Customer, Booking } from "@prisma/client";
import { UpdateBillDialog } from "@/components/bills/update-bill-dialog";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import { AddBillPaymentDialog } from "@/components/bills/add-bill-payment-dialog";

type BillWithRelations = Bill & {
  customer: Customer;
  bookings: Booking[];
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

interface BillListProps {
  customerId?: string;
  onEdit?: (bill: BillWithRelations) => void;
  onDelete?: (bill: BillWithRelations) => void;
}

export function BillList({ customerId, onEdit, onDelete }: BillListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Data fetching logic
  const { data: allBills, isLoading: isLoadingAll } = useBills({ enabled: !customerId });
  const { data: customerData, isLoading: isLoadingCustomer } = useCustomer(customerId || "");

  const rawBills = customerId 
    ? (customerData?.bills as unknown as BillWithRelations[])
    : allBills as BillWithRelations[];

  const isLoading = customerId ? isLoadingCustomer : isLoadingAll;

  // Hooks and State
  const deleteBill = useDeleteBill();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  
  const [updateBillDialogOpen, setUpdateBillDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillWithRelations | null>(null);

  const [createBillDialogOpen, setCreateBillDialogOpen] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<BillWithRelations | null>(null);

  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) || []
  );

  // Pagination and Sort State (Local)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc");

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    else params.delete("status");
    
    const queryString = params.toString();
    const currentQueryString = searchParams.toString();
    
    if (queryString !== currentQueryString) {
      router.replace(`${pathname}?${queryString}`, { scroll: false });
    }
  }, [statusFilter, searchParams, router, pathname]);

  // Handlers
  const handleSort = (key: string) => {
    if (key === "created_at") { // Only sort by created_at as requested
       if (sortKey === key) {
        if (sortDirection === "asc") setSortDirection("desc");
        else if (sortDirection === "desc") {
            setSortDirection(null);
            setSortKey("");
        } else setSortDirection("asc");
       } else {
        setSortKey(key);
        setSortDirection("desc"); // Default desc for created_at
       }
    }
  };

  const handleDeleteClick = (bill: BillWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
        onDelete(bill);
    } else {
        setBillToDelete(bill.id);
        setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (billToDelete) {
      await deleteBill.mutateAsync(billToDelete);
      setDeleteDialogOpen(false);
      setBillToDelete(null);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter.length > 0;

  // Filter Data
  const filteredBills = rawBills
    ? rawBills.filter((bill) => {
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(bill.status);
        return matchesStatus;
      })
    : [];

  // Sorting
  const sortedData = filteredBills
    ? [...filteredBills].sort((a, b) => {
        if (sortKey !== "created_at" || !sortDirection) return 0;
        
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();

        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    })
    : [];

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Columns
  const columns: ColumnDef<BillWithRelations>[] = [
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "110px",
      sortable: true,
      render: (item) => (
        <span className="text-sm text-muted-foreground">{formatDateShort(item.created_at)}</span>
      ),
    },
    ...(customerId ? [
      {
        key: "id",
        label: "Mã hóa đơn",
        width: "300px",
        render: (item: BillWithRelations) => <span className="font-mono text-sm">{item.id}</span>
      }
    ] : []
    ),
    // Conditionally add Customer Column
    ...(customerId ? [] : [{
      key: "customer",
      label: "Khách hàng",
      width: "200px",
      render: (item: BillWithRelations) => <span className="font-medium">{item.customer?.name}</span>,
    }]),
    {
      key: "notes",
      label: "Ghi chú",
      render: (item) => <span className="text-muted-foreground">{item.notes || "—"}</span>,
    },
    {
      key: "total_amount",
      label: "Tổng tiền",
      align: "right",
      width: "140px",
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
      render: (item: BillWithRelations) => (
        <StatusBadge
          variant={getBillStatusVariant(item.status)}
          label={getBillStatusLabel(item.status)}
        />
      ),
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      align: "right",
      render: (item) => (
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
                        setPayingBill(item);
                        setAddPaymentDialogOpen(true);
                      }}
                      disabled={item.status === BillStatus.Completed}
                    >
                      <CreditCard className={`h-4 w-4 ${item.status === BillStatus.Completed ? "text-muted-foreground" : "text-green-600"}`} />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.status === BillStatus.Completed ? "Hóa đơn đã thanh toán đầy đủ" : "Thêm thanh toán"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(item);
              } else {
                setEditingBill(item);
                setUpdateBillDialogOpen(true);
              }
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {item.status !== BillStatus.Open ? (
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
                    <p>Hóa đơn đã ghi nhận thanh toán nên không thể xóa</p>
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
                    { value: BillStatus.Open, label: "Chưa thu" },
                    { value: BillStatus.PartialPaid, label: "Thu 1 phần" },
                    { value: BillStatus.Completed, label: "Hoàn thành" },
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
            
            {customerId && (
                <Button onClick={() => setCreateBillDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm hóa đơn
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
        onRowClick={(item) => router.push(`/bills/${item.id}`)}
        emptyMessage="Chưa có hóa đơn"
        emptyDescription="Tạo hóa đơn đầu tiên để bắt đầu"
      />

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
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteBill.isPending}>
              {deleteBill.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {editingBill && (
        <UpdateBillDialog
           open={updateBillDialogOpen}
           onOpenChange={(open) => {
             setUpdateBillDialogOpen(open);
             if (!open) setEditingBill(null);
           }}
           bill={editingBill}
        />
      )}

      {customerId && (
        <CreateBillDialog
            open={createBillDialogOpen}
            onOpenChange={setCreateBillDialogOpen}
            customerId={customerId}
        />
      )}

      {payingBill && (
        <AddBillPaymentDialog
          open={addPaymentDialogOpen}
          onOpenChange={(open) => {
            setAddPaymentDialogOpen(open);
            if (!open) setPayingBill(null);
          }}
          bill={payingBill}
        />
      )}
    </div>
  );
}
