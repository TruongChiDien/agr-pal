"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useService } from "@/hooks/use-services";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Edit, ArrowLeft } from "lucide-react";

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { data: service, isLoading } = useService(id);

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
            <Button variant="outline" onClick={() => router.push("/services")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
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
            <Button onClick={() => router.push(`/services/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={() => router.push("/services")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
        }
      >
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

        {/* Future: Price history table */}
        {service.job_types && service.job_types.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Loại công việc liên quan</h3>
              <div className="grid gap-4">
                {service.job_types.map((jobType: any) => (
                  <div key={jobType.id} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">{jobType.name}</span>
                    <span className="text-muted-foreground">
                      Lương cơ bản: {formatCurrency(Number(jobType.base_salary))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </ContentSection>
    </PageContainer>
  );
}
