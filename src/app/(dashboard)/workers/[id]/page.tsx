"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorker, useDeleteWorkerWeight, useDeleteWorker } from "@/hooks/use-workers";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { WorkerWeightDialog } from "@/components/workers/worker-weight-dialog";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { JobList } from "@/components/jobs/job-list";
import { AdvanceList } from "@/components/advances/advance-list";
import { PayrollList } from "@/components/payroll/payroll-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateWorkerDialog } from "@/components/workers/update-worker-dialog";
import type { Worker_Weight, Job_Type, Advance_Payment } from "@/types";

type WorkerWeightWithJobType = Worker_Weight & {
  job_type?: Job_Type & { service?: { name: string } };
};

type AdvanceWithRelations = Advance_Payment;


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
  // Get initial tab from URL or default to "info"
  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WorkerWeightWithJobType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weightToDelete, setWeightToDelete] = useState<string | null>(null);
  const [deleteWorkerDialogOpen, setDeleteWorkerDialogOpen] = useState(false);
  const [updateWorkerDialogOpen, setUpdateWorkerDialogOpen] = useState(false);

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
            <Button variant="outline" onClick={() => setUpdateWorkerDialogOpen(true)}>
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
              <CardContent className="grid gap-8 md:grid-cols-2 pt-6">
                {/* Column 1: Personal Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tên công nhân</p>
                    <p className="font-medium">{worker.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{worker.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{worker.address || "—"}</p>
                  </div>
                </div>

                {/* Column 2: Financial Info */}
                <div className="space-y-4">
                  {(() => {
                    // Calculate Financials
                    const wagesDue = worker.payroll_sheets?.reduce((sum, p) => {
                       const total = Number(p.net_payable) || 0;
                       const paid = Number(p.total_paid) || 0;
                       return sum + (total - paid);
                    }, 0) || 0;

                    const pendingJobsValue = worker.jobs
                      ?.filter(j => j.payment_status === "PENDING_PAYROLL")
                      .reduce((sum, j) => sum + Number(j.final_pay || 0), 0) || 0;

                    const pendingAdvancesValue = worker.advance_payments
                      ?.filter(a => a.status === "UNPROCESSED")
                      .reduce((sum, a) => sum + Number(a.amount), 0) || 0;
                    
                    const estimatedWage = pendingJobsValue - pendingAdvancesValue;

                    const totalWage = wagesDue + estimatedWage;

                    return (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Lương đang nợ</p>
                          <p className={`font-medium ${wagesDue > 0 ? "text-destructive" : ""}`}>
                            {formatCurrency(wagesDue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Lương ước tính</p>
                          <p className={`font-medium ${estimatedWage > 0 ? "text-orange-600" : ""}`}>
                            {formatCurrency(estimatedWage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tổng lương</p>
                          <p className={`font-bold ${totalWage > 0 ? "text-destructive" : ""}`}>
                            {formatCurrency(totalWage)}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Job Types (Worker Weights) */}
          <TabsContent value="job-types" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div>
                  <Button onClick={() => setWeightDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm loại công việc
                  </Button>
                </div>
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
            {worker.jobs && worker.jobs.length > 0 ? (
                <JobList workerId={id} />
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
            <AdvanceList workerId={id} workerName={worker.name} />
          </TabsContent>

          {/* Tab 5: Payrolls */}
          <TabsContent value="payrolls" className="mt-6">
            <PayrollList workerId={id} workerName={worker.name} />
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

      <UpdateWorkerDialog
        open={updateWorkerDialogOpen}
        onOpenChange={setUpdateWorkerDialogOpen}
        worker={worker}
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



      {/* Delete Worker Confirmation Dialog */}
      <Dialog open={deleteWorkerDialogOpen} onOpenChange={setDeleteWorkerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa công nhân này? Hành động này không thể hoàn tác.
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

    </PageContainer>
  );
}
