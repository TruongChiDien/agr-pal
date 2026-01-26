"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { usePayroll, useDeletePayroll } from "@/hooks/use-payroll";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { PayrollPaymentHistory } from "@/components/payroll/payroll-payment-history";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ArrowLeft, Plus, Trash2, ExternalLink, Edit } from "lucide-react";
import { PayrollStatus } from "@/types/enums";
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
import { UpdatePayrollDialog } from "@/components/payroll/update-payroll-dialog";
import { AddPayrollPaymentDialog } from "@/components/payroll/add-payroll-payment-dialog";
import type { Job, Booking, Customer, Land, Service, Job_Type, Advance_Payment } from "@prisma/client";

type JobWithRelations = Job & {
  booking: Booking & {
    customer: Customer;
    land: Land | null;
    service: Service;
  };
  job_type: Job_Type;
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

export default function PayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: payroll, isLoading } = usePayroll(id);
  const deletePayroll = useDeletePayroll();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    await deletePayroll.mutateAsync(id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/payroll");
      },
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Chi tiết phiếu lương" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!payroll) {
    return (
      <PageContainer>
        <ContentSection title="Không tìm thấy" description="Phiếu lương không tồn tại">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-muted-foreground">Phiếu lương không tồn tại hoặc đã bị xóa</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const totalWages = Number(payroll.total_wages);
  const totalAdv = Number(payroll.total_adv);
  const adjustment = Number((payroll as any).adjustment || 0);
  const netPayable = Number(payroll.net_payable);
  const totalPaid = Number(payroll.total_paid);
  const balance = netPayable - totalPaid;

  const jobs = (payroll.jobs || []) as JobWithRelations[];
  const advances = (payroll.advance_payments || []) as Advance_Payment[];

  // Table 1: Jobs columns
  const jobColumns: ColumnDef<JobWithRelations>[] = [
    {
      key: "customer",
      label: "Khách hàng",
      width: "180px",
      render: (item) => (
        <div>
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-sm text-primary hover:no-underline hover:text-primary/80"
            onClick={() => router.push(`/customers/${item.booking.customer.id}`)}
          >
            {item.booking.customer.name}
          </Button>
          <p className="text-xs text-muted-foreground">
            {item.booking.land?.name || "Chưa chọn"}
          </p>
        </div>
      ),
    },
    {
      key: "service",
      label: "Dịch vụ",
      width: "200px",
      render: (item) => (
        <div>
          <p className="text-sm font-medium">{item.booking.service.name}</p>
          <p className="text-xs text-muted-foreground">{item.job_type.name}</p>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Số lượng",
      align: "right",
      width: "120px",
      render: (item) => (
        <span className="text-sm">
          {Number(item.actual_qty)} {item.booking.service.unit}
        </span>
      ),
    },
    {
      key: "calculation",
      label: "Tính toán",
      align: "right",
      width: "180px",
      render: (item) => (
        <div className="text-xs text-muted-foreground text-right">
          <p>
            {formatCurrency(Number(item.applied_base))} × {Number(item.applied_weight)}
          </p>
        </div>
      ),
    },
    {
      key: "final_pay",
      label: "Thành tiền",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-sm font-semibold text-primary">
          {formatCurrency(Number(item.final_pay))}
        </span>
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
  ];

  // Table 2: Advances columns
  const advanceColumns: ColumnDef<Advance_Payment>[] = [
    {
      key: "id",
      label: "Mã tạm ứng",
      width: "150px",
      render: (item) => (
        <span className="text-sm font-medium">
          #{item.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Số tiền",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-sm font-semibold text-destructive">
          {formatCurrency(Number(item.amount))}
        </span>
      ),
    },
    {
      key: "notes",
      label: "Ghi chú",
      render: (item) => (
        <span className="text-sm text-muted-foreground italic">
          {item.notes || "Không có ghi chú"}
        </span>
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
  ];

  return (
    <PageContainer>
      <ContentSection
        title="Chi tiết phiếu lương"
        description={`Phiếu lương cho ${payroll.worker.name}`}
        actions={
          <div className="flex gap-2">
             <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Cập nhật
            </Button>

            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button 
                      variant="destructive" 
                      onClick={() => totalPaid === 0 && setDeleteDialogOpen(true)}
                      disabled={totalPaid > 0}
                      className={totalPaid > 0 ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </Button>
                  </span>
                </TooltipTrigger>
                {totalPaid > 0 && (
                  <TooltipContent>
                    <p>Phiếu lương đã có thanh toán nên không thể xoá</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Payroll Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phiếu lương</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Công nhân</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-lg text-primary hover:no-underline hover:text-primary/80"
                    onClick={() => router.push(`/workers/${payroll.worker.id}`)}
                  >
                    {payroll.worker.name}
                  </Button>
                  {payroll.worker.phone && (
                    <p className="text-sm text-muted-foreground">{payroll.worker.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="text-lg font-medium">{formatDateShort(payroll.created_at)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3">
                  {/* Total Wages */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Tổng lương</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(totalWages)}
                    </p>
                  </div>

                  {/* Total Advances (only show if > 0) */}
                  {totalAdv > 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Tạm ứng</p>
                      <p className="text-lg font-semibold text-destructive">
                        - {formatCurrency(totalAdv)}
                      </p>
                    </div>
                  )}

                  {/* Adjustment */}
                  {adjustment !== 0 && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Điều chỉnh</p>
                      <p className={`text-lg font-semibold ${adjustment > 0 ? "text-purple-600 dark:text-purple-400" : "text-destructive"}`}>
                        {adjustment > 0 ? "+" : ""} {formatCurrency(adjustment)}
                      </p>
                    </div>
                  )}

                  {/* Net Payable (after advances) */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-sm font-medium">Thực nhận</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(netPayable)}
                    </p>
                  </div>

                  {/* Amount Paid */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Đã trả</p>
                    <p className="text-xl font-semibold text-green-600">
                      {formatCurrency(totalPaid)}
                    </p>
                  </div>

                  {/* Remaining Balance */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-sm font-medium">Còn lại</p>
                    <p className={`text-xl font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Trạng thái</p>
                  <StatusBadge
                    variant={getPayrollStatusVariant(payroll.status)}
                    label={getPayrollStatusLabel(payroll.status)}
                  />
                </div>
                {balance > 0 && (
                  <Button onClick={() => setAddPaymentDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thanh toán
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table 1: Jobs in Payroll */}
          <Card>
            <CardHeader>
              <CardTitle>Các công việc ({jobs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Không có công việc nào
                </p>
              ) : (
                <DataTable
                  columns={jobColumns}
                  data={jobs}
                  currentPage={1}
                  pageSize={100}
                  totalPages={1}
                  totalItems={jobs.length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  sortKey=""
                  sortDirection={null}
                  onSort={() => {}}
                  getRowId={(item) => item.id}
                  onRowClick={(item) => router.push(`/jobs/${item.id}`)}
                  emptyMessage="Không có công việc"
                  emptyDescription=""
                />
              )}
            </CardContent>
          </Card>

          {/* Table 2: Advances in Payroll */}
          {advances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Các khoản tạm ứng ({advances.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={advanceColumns}
                  data={advances}
                  currentPage={1}
                  pageSize={100}
                  totalPages={1}
                  totalItems={advances.length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  sortKey=""
                  sortDirection={null}
                  onSort={() => {}}
                  getRowId={(item) => item.id}
                  emptyMessage="Không có khoản tạm ứng"
                  emptyDescription=""
                />
              </CardContent>
            </Card>
          )}

          {/* Table 3: Payment History */}
          <PayrollPaymentHistory payments={payroll.payments || []} />
        </div>
      </ContentSection>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa phiếu lương cho công nhân "{payroll.worker.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
      
      <UpdatePayrollDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        // @ts-ignore
        payroll={payroll}
      />
      
      <AddPayrollPaymentDialog
        open={addPaymentDialogOpen}
        onOpenChange={setAddPaymentDialogOpen}
        // @ts-ignore
        payroll={payroll}
      />
    </PageContainer>
  );
}
