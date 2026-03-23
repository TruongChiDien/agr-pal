"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorker, useDeleteWorker } from "@/hooks/use-workers";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
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
import type { Advance_Payment } from "@/types";

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
  const deleteWorker = useDeleteWorker();

  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [deleteWorkerDialogOpen, setDeleteWorkerDialogOpen] = useState(false);
  const [updateWorkerDialogOpen, setUpdateWorkerDialogOpen] = useState(false);

  // Sync tab with URL parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/workers/${id}?${params.toString()}`, { scroll: false });
  };

  const handleDeleteWorkerConfirm = async () => {
    await deleteWorker.mutateAsync(id, {
      onSuccess: () => {
        setDeleteWorkerDialogOpen(false);
        router.push("/workers");
      },
    });
  };

  // Calculate current balance from unpaid advances
  const calculateBalance = (advances?: AdvanceWithRelations[]): number => {
    if (!advances) return 0;
    return advances
      .filter((a) => a.status === "UNPROCESSED")
      .reduce((sum, a) => sum + Number(a.amount), 0);
  };

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="jobs">
              Công việc ({worker.daily_workers?.length || 0})
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
                    const wagesDue = worker.payroll_sheets?.reduce((sum, p) => {
                      const total = Number(p.net_payable) || 0;
                      const paid = Number(p.total_paid) || 0;
                      return sum + (total - paid);
                    }, 0) || 0;

                    const pendingJobsValue = worker.daily_workers
                      ?.filter(dw => dw.payment_status === "PENDING_PAYROLL")
                      .reduce((sum, dw) => {
                        const base = Number(dw.applied_base) || 0;
                        const weight = Number(dw.applied_weight) || 1;
                        const adjust = Number(dw.payment_adjustment) || 0;
                        return sum + (base * weight + adjust);
                      }, 0) || 0;

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

          {/* Tab 2: Jobs */}
          <TabsContent value="jobs" className="mt-6">
            <div className="space-y-4">
              {worker.daily_workers && worker.daily_workers.length > 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center h-48">
                    <p className="text-muted-foreground">Tính năng xem chi tiết lịch sử làm việc theo ngày đang được cập nhật.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground">Chưa có công việc nào</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Advance Payments */}
          <TabsContent value="advances" className="mt-6">
            <AdvanceList workerId={id} workerName={worker.name} />
          </TabsContent>

          {/* Tab 4: Payrolls */}
          <TabsContent value="payrolls" className="mt-6">
            <PayrollList workerId={id} workerName={worker.name} />
          </TabsContent>
        </Tabs>
      </ContentSection>

      <UpdateWorkerDialog
        open={updateWorkerDialogOpen}
        onOpenChange={setUpdateWorkerDialogOpen}
        worker={worker}
      />

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
