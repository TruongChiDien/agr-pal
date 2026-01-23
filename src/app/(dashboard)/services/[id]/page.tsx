"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useService, useDeleteService } from "@/hooks/use-services";
import { useDeleteJobType } from "@/hooks/use-job-types";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Edit, ArrowLeft, Trash2, Plus } from "lucide-react";
import { JobTypeDialog } from "@/components/services/job-type-dialog";
import type { Job_Type } from "@prisma/client";

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { data: service, isLoading } = useService(id);
  const deleteService = useDeleteService();
  const deleteJobType = useDeleteJobType();

  // Tab state
  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    const urlTab = searchParams.get("tab") || "info";
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`/services/${id}?${params.toString()}`, { scroll: false });
  };

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobTypeDialogOpen, setJobTypeDialogOpen] = useState(false);
  const [editingJobType, setEditingJobType] = useState<Job_Type | undefined>(undefined);
  const [deleteJobTypeDialogOpen, setDeleteJobTypeDialogOpen] = useState(false);
  const [jobTypeToDelete, setJobTypeToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    await deleteService.mutateAsync(id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/services");
      },
    });
  };

  const handleEditJobType = (jobType: Job_Type) => {
    setEditingJobType(jobType);
    setJobTypeDialogOpen(true);
  }

  const handleDeleteJobTypeClick = (jobTypeId: string) => {
    setJobTypeToDelete(jobTypeId);
    setDeleteJobTypeDialogOpen(true);
  }

  const handleDeleteJobTypeConfirm = async () => {
    if (jobTypeToDelete) {
      await deleteJobType.mutateAsync(jobTypeToDelete, {
        onSuccess: () => {
          setDeleteJobTypeDialogOpen(false);
          setJobTypeToDelete(null);
        }
      });
    }
  }

  const handleCloseJobTypeDialog = () => {
    setJobTypeDialogOpen(false);
    setEditingJobType(undefined);
  }

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection
          title="Chi tiết dịch vụ"
          description="Đang tải thông tin dịch vụ..."
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!service) {
    return (
      <PageContainer>
        <ContentSection
          title="Không tìm thấy"
          description="Dịch vụ không tồn tại hoặc đã bị xóa"
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          }
        >
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center">
                Không tìm thấy dịch vụ với ID: {id}
              </p>
            </CardContent>
          </Card>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title={service.name}
        description={`Mã dịch vụ: ${service.id}`}
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
            <Button variant="outline" onClick={() => router.push(`/services/${id}/edit`)}>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="job-types">
              Loại công việc ({service.job_types?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <Card>
              <CardContent className="grid gap-6 md:grid-cols-2 p-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tên dịch vụ</p>
                  <p className="font-medium text-lg">{service.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Đơn vị tính</p>
                  <p className="font-medium text-lg">{service.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Giá hiện tại</p>
                  <p className="font-medium text-2xl text-primary">
                    {formatCurrency(Number(service.price))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ngày tạo</p>
                  <p className="font-medium text-lg">{formatDateShort(service.created_at)}</p>
                </div>
                {service.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Mô tả</p>
                    <p className="font-medium">{service.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job-types" className="mt-6">
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-semibold">Danh sách loại công việc</h3>
                   <p className="text-sm text-muted-foreground">
                     Quản lý các loại công việc thuộc dịch vụ này
                   </p>
                 </div>
                 <Button onClick={() => setJobTypeDialogOpen(true)}>
                   <Plus className="h-4 w-4 mr-2" />
                   Thêm loại công việc
                 </Button>
               </div>

               {service.job_types && service.job_types.length > 0 ? (
                 <Card>
                   <div className="divide-y">
                     {service.job_types.map((jobType: any) => (
                       <div key={jobType.id} className="flex justify-between items-center p-4">
                         <div>
                           <p className="font-medium">{jobType.name}</p>
                           <p className="text-sm text-muted-foreground">
                             Lương cơ bản: {formatCurrency(Number(jobType.default_base_salary))}
                           </p>
                         </div>
                         <div className="flex gap-2">
                           <Button variant="ghost" size="sm" onClick={() => handleEditJobType(jobType)}>
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDeleteJobTypeClick(jobType.id)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </Card>
               ) : (
                 <Card>
                   <CardContent className="flex flex-col items-center justify-center h-48">
                     <p className="text-muted-foreground mb-4">
                       Chưa có loại công việc nào
                     </p>
                     <Button onClick={() => setJobTypeDialogOpen(true)}>
                       <Plus className="h-4 w-4 mr-2" />
                       Thêm loại công việc đầu tiên
                     </Button>
                   </CardContent>
                 </Card>
               )}
             </div>
          </TabsContent>
        </Tabs>
      </ContentSection>

      {/* Service Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa dịch vụ "{service.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteService.isPending}
            >
              {deleteService.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Type Dialog */}
      <JobTypeDialog 
        open={jobTypeDialogOpen} 
        onClose={handleCloseJobTypeDialog} 
        serviceId={id} 
        initialData={editingJobType}
      />

      {/* Job Type Delete Dialog */}
      <Dialog open={deleteJobTypeDialogOpen} onOpenChange={setDeleteJobTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa loại công việc này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteJobTypeDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJobTypeConfirm}
              disabled={deleteJobType.isPending}
            >
              {deleteJobType.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
