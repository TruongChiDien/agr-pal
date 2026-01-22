"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorker, useDeleteWorkerWeight, useDeleteWorker, useDeleteAdvancePayment } from "@/hooks/use-workers";
import { useDeleteJob } from "@/hooks/use-jobs";
import { useDeletePayroll } from "@/hooks/use-payroll";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { WorkerWeightDialog } from "@/components/workers/worker-weight-dialog";
import { AdvancePaymentDialog } from "@/components/workers/advance-payment-dialog";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { JobStatus, AdvanceStatus, PayrollStatus } from "@/types/enums";
import { JobStatusBadge, JobPaymentStatusBadge, AdvanceStatusBadge, PayrollStatusBadge } from "@/components/status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Worker_Weight, Job_Type, Job, Booking, Customer, Service, Advance_Payment, Payroll_Sheet } from "@/types";

type WorkerWeightWithJobType = Worker_Weight & {
  job_type?: Job_Type & { service?: { name: string } };
};

type JobWithRelations = Job & {
  booking?: Booking & {
    customer?: Customer;
    service?: Service;
  };
};

type AdvanceWithRelations = Advance_Payment;
type PayrollWithRelations = Payroll_Sheet;

export default function WorkerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { data: worker, isLoading } = useWorker(id);
  const deleteWeight = useDeleteWorkerWeight();
  const deleteWorker = useDeleteWorker();
  const deleteAdvance = useDeleteAdvancePayment();
  const deleteJob = useDeleteJob();
  const deletePayroll = useDeletePayroll();

  // Get initial tab from URL or default to "info"
  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WorkerWeightWithJobType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weightToDelete, setWeightToDelete] = useState<string | null>(null);
  const [deleteWorkerDialogOpen, setDeleteWorkerDialogOpen] = useState(false);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [deleteAdvanceDialogOpen, setDeleteAdvanceDialogOpen] = useState(false);
  const [advanceToDelete, setAdvanceToDelete] = useState<string | null>(null);
  const [deleteJobDialogOpen, setDeleteJobDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [deletePayrollDialogOpen, setDeletePayrollDialogOpen] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<string | null>(null);

  // Sync tab with URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/workers/${id}?${params.toString()}`, { scroll: false });
  };

  const handleDeleteWeightClick = (weightId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWeightToDelete(weightId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteWeightConfirm = async () => {
    if (weightToDelete) {
      await deleteWeight.mutateAsync(weightToDelete);
      setDeleteDialogOpen(false);
      setWeightToDelete(null);
    }
  };

  const handleDeleteWorkerConfirm = async () => {
    await deleteWorker.mutateAsync(id, {
      onSuccess: () => {
        setDeleteWorkerDialogOpen(false);
        router.push("/workers");
      },
    });
  };

  const handleEditWeight = (weight: WorkerWeightWithJobType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingWeight(weight);
    setWeightDialogOpen(true);
  };

  const handleCloseWeightDialog = () => {
    setWeightDialogOpen(false);
    setEditingWeight(null);
  };

  const handleDeleteAdvanceClick = (advanceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvanceToDelete(advanceId);
    setDeleteAdvanceDialogOpen(true);
  };

  const handleDeleteAdvanceConfirm = async () => {
    if (advanceToDelete) {
      await deleteAdvance.mutateAsync(advanceToDelete);
      setDeleteAdvanceDialogOpen(false);
      setAdvanceToDelete(null);
    }
  };

  const handleDeleteJobClick = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobToDelete(jobId);
    setDeleteJobDialogOpen(true);
  };

  const handleDeleteJobConfirm = async () => {
    if (jobToDelete) {
      await deleteJob.mutateAsync(jobToDelete);
      setDeleteJobDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const handleDeletePayrollClick = (payrollId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayrollToDelete(payrollId);
    setDeletePayrollDialogOpen(true);
  };

  const handleDeletePayrollConfirm = async () => {
    if (payrollToDelete) {
      await deletePayroll.mutateAsync(payrollToDelete);
      setDeletePayrollDialogOpen(false);
      setPayrollToDelete(null);
    }
  };

  // Calculate current balance from unpaid advances
  const calculateBalance = (advances?: AdvanceWithRelations[]): number => {
    if (!advances) return 0;
    return advances
      .filter((a) => a.status === "UNPROCESSED")
      .reduce((sum, a) => sum + Number(a.amount), 0);
  };

  // Worker Weight Columns
  const weightColumns: ColumnDef<WorkerWeightWithJobType>[] = [
    {
      key: "job_type",
      label: "Loại công việc",
      render: (item) => (
        <div>
          <p className="font-medium">{item.job_type?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">
            {item.job_type?.service?.name || ""}
          </p>
        </div>
      ),
    },
    {
      key: "default_base_salary",
      label: "Lương cơ bản",
      align: "right",
      width: "150px",
      render: (item) => (
        <span className="text-muted-foreground">
          {item.job_type?.default_base_salary
            ? formatCurrency(Number(item.job_type.default_base_salary))
            : "—"}
        </span>
      ),
    },
    {
      key: "weight",
      label: "Hệ số",
      align: "right",
      width: "100px",
      render: (item) => (
        <Badge variant={Number(item.weight) >= 1 ? "default" : "secondary"}>
          {Number(item.weight).toFixed(1)}x
        </Badge>
      ),
    },
    {
      key: "final_salary",
      label: "Lương thực tế",
      align: "right",
      width: "150px",
      render: (item) => {
        if (!item.job_type?.default_base_salary) return <span>—</span>;
        const finalSalary =
          Number(item.job_type.default_base_salary) * Number(item.weight);
        return (
          <span className="font-medium text-primary">
            {formatCurrency(finalSalary)}
          </span>
        );
      },
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
            onClick={(e) => handleEditWeight(item, e)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteWeightClick(item.id, e)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Jobs Columns
  const jobColumns: ColumnDef<JobWithRelations>[] = [
    {
      key: "booking",
      label: "Khách hàng / Dịch vụ",
      render: (item) => (
        <div>
          <p className="font-medium">{item.booking?.customer?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground">
            {item.booking?.service?.name || ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "140px",
      align: "center",
      render: (item) => <JobStatusBadge status={item.status as JobStatus} />,
    },
    {
      key: "payment_status",
      label: "Thanh toán",
      width: "140px",
      align: "center",
      render: (item) => <JobPaymentStatusBadge status={item.payment_status as any} />,
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "120px",
      align: "right",
      render: (item) => (
        <span className="text-muted-foreground text-sm">
          {formatDateShort(new Date(item.created_at))}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      align: "right",
      render: (item) => {
        // Only show delete button if job is not completed, not fully paid, and not added to bill
        const canDelete =
          item.status !== JobStatus.Completed &&
          item.payment_status == "PENDING_PAYROLL";

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/jobs/${item.id}/edit?redirect=${encodeURIComponent(`/workers/${id}`)}`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteJobClick(item.id, e)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Advance Payment Columns
  const advanceColumns: ColumnDef<AdvanceWithRelations>[] = [
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
    {
      key: "amount",
      label: "Số tiền",
      align: "right",
      width: "150px",
      render: (item) => (
        <span className="font-medium text-primary">
          {formatCurrency(Number(item.amount))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "140px",
      align: "center",
      render: (item) => <AdvanceStatusBadge status={item.status as any} />,
    },
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
      key: "actions",
      label: "",
      width: "80px",
      align: "right",
      render: (item) => {
        // Only show delete button if not yet processed
        if (item.status === "PROCESSED") return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteAdvanceClick(item.id, e)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        );
      },
    },
  ];

  // Payroll Columns
  const payrollColumns: ColumnDef<PayrollWithRelations>[] = [
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
    {
      key: "total_wages",
      label: "Tổng lương",
      align: "right",
      width: "150px",
      render: (item) => (
        <span className="text-muted-foreground">
          {formatCurrency(Number(item.total_wages))}
        </span>
      ),
    },
    {
      key: "total_adv",
      label: "Tạm ứng",
      align: "right",
      width: "150px",
      render: (item) => (
        <span className="text-muted-foreground">
          {formatCurrency(Number(item.total_adv))}
        </span>
      ),
    },
    {
      key: "net_payable",
      label: "Thực nhận",
      align: "right",
      width: "150px",
      render: (item) => (
        <span className="font-medium text-primary">
          {formatCurrency(Number(item.net_payable))}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "140px",
      align: "center",
      render: (item) => <PayrollStatusBadge status={item.status as any} />,
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      align: "right",
      render: (item) => {
        // Only show delete button if payroll has not been paid
        const canDelete = Number(item.total_paid) === 0;

        if (!canDelete) return null;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeletePayrollClick(item.id, e)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Chi tiết công nhân" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!worker) {
    return (
      <PageContainer>
        <ContentSection title="Không tìm thấy" description="Công nhân không tồn tại">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </ContentSection>
      </PageContainer>
    );
  }

  const currentBalance = calculateBalance(worker.advance_payments);

  return (
    <PageContainer>
      <ContentSection
        title={worker.name}
        description="Thông tin chi tiết công nhân"
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setDeleteWorkerDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
            <Button variant="outline" onClick={() => router.push(`/workers/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        }
      >
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="job-types">
              Loại CV ({worker.worker_weights?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="jobs">
              Công việc ({worker.jobs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="advances">
              Tạm ứng ({worker.advance_payments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="payrolls">
              Phiếu lương ({worker.payroll_sheets?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Worker Info */}
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tên</p>
                  <p className="font-medium">{worker.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{worker.phone || "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{worker.address || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số loại công việc</p>
                  <p className="font-medium">
                    <Badge variant="secondary">
                      {worker.worker_weights?.length || 0} loại
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số dư tạm ứng</p>
                  <p className={`font-bold ${currentBalance > 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Job Types (Worker Weights) */}
          <TabsContent value="job-types" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Loại công việc và hệ số lương</h3>
                  <p className="text-sm text-muted-foreground">
                    Quản lý loại công việc mà công nhân có thể thực hiện
                  </p>
                </div>
                <Button onClick={() => setWeightDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm loại công việc
                </Button>
              </div>

              {worker.worker_weights && worker.worker_weights.length > 0 ? (
                <DataTable
                  columns={weightColumns}
                  data={worker.worker_weights}
                  getRowId={(item) => item.id}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground mb-4">
                      Chưa có loại công việc nào
                    </p>
                    <Button onClick={() => setWeightDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm loại công việc đầu tiên
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Jobs */}
          <TabsContent value="jobs" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Lịch sử công việc</h3>
                  <p className="text-sm text-muted-foreground">
                    Danh sách công việc đã và đang thực hiện
                  </p>
                </div>
              </div>

              {worker.jobs && worker.jobs.length > 0 ? (
                <DataTable
                  columns={jobColumns}
                  data={worker.jobs}
                  getRowId={(item) => item.id}
                  onRowClick={(item) => router.push(`/jobs/${item.id}`)}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground">
                      Chưa có công việc nào
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 4: Advance Payments */}
          <TabsContent value="advances" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Lịch sử tạm ứng</h3>
                  <p className="text-sm text-muted-foreground">
                    Quản lý các khoản tạm ứng của công nhân
                  </p>
                </div>
                <Button onClick={() => setAdvanceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo tạm ứng mới
                </Button>
              </div>

              {worker.advance_payments && worker.advance_payments.length > 0 ? (
                <DataTable
                  columns={advanceColumns}
                  data={worker.advance_payments}
                  getRowId={(item) => item.id}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground mb-4">
                      Chưa có tạm ứng nào
                    </p>
                    <Button onClick={() => setAdvanceDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo tạm ứng đầu tiên
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 5: Payrolls */}
          <TabsContent value="payrolls" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Lịch sử phiếu lương</h3>
                  <p className="text-sm text-muted-foreground">
                    Danh sách các phiếu lương của công nhân
                  </p>
                </div>
                <Button onClick={() => router.push(`/payroll/new?worker_id=${id}&redirect=${encodeURIComponent(`/workers/${id}?tab=payrolls`)}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo phiếu lương mới
                </Button>
              </div>

              {worker.payroll_sheets && worker.payroll_sheets.length > 0 ? (
                <DataTable
                  columns={payrollColumns}
                  data={worker.payroll_sheets}
                  getRowId={(item) => item.id}
                  onRowClick={(item) => router.push(`/payroll/${item.id}`)}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground mb-4">
                      Chưa có phiếu lương nào
                    </p>
                    <Button onClick={() => router.push(`/payroll/new?worker_id=${id}`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo phiếu lương đầu tiên
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ContentSection>

      {/* Worker Weight Dialog */}
      <WorkerWeightDialog
        open={weightDialogOpen}
        onClose={handleCloseWeightDialog}
        workerId={id}
        initialData={editingWeight || undefined}
      />

      {/* Advance Payment Dialog */}
      <AdvancePaymentDialog
        open={advanceDialogOpen}
        onClose={() => setAdvanceDialogOpen(false)}
        workerId={id}
        workerName={worker.name}
      />

      {/* Delete Weight Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa hệ số lương này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteWeightConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Advance Confirmation Dialog */}
      <Dialog open={deleteAdvanceDialogOpen} onOpenChange={setDeleteAdvanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khoản tạm ứng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAdvanceDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdvanceConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Worker Confirmation Dialog */}
      <Dialog open={deleteWorkerDialogOpen} onOpenChange={setDeleteWorkerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa công nhân "{worker.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWorkerDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkerConfirm}
              disabled={deleteWorker.isPending}
            >
              {deleteWorker.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Job Confirmation Dialog */}
      <Dialog open={deleteJobDialogOpen} onOpenChange={setDeleteJobDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa công việc này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteJobDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJobConfirm}
              disabled={deleteJob.isPending}
            >
              {deleteJob.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payroll Confirmation Dialog */}
      <Dialog open={deletePayrollDialogOpen} onOpenChange={setDeletePayrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa phiếu lương này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePayrollDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePayrollConfirm}
              disabled={deletePayroll.isPending}
            >
              {deletePayroll.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
