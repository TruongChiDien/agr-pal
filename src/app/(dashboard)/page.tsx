import { PageContainer, ContentSection } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <PageContainer>
      <ContentSection
        title="Bảng điều khiển"
        description="Chào mừng đến với Agri-ERP - Hệ thống quản lý dịch vụ nông nghiệp của bạn"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thao tác nhanh
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Tổng doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45,231,000 đ</div>
              <p className="text-xs text-muted-foreground">
                +20.1% so với tháng trước
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Đơn hàng đang hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12</div>
              <p className="text-xs text-muted-foreground">
                +4 so với tuần trước
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Hóa đơn chờ xử lý
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Tổng cộng: 12,500,000 đ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Máy móc đang hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">
                3 máy đang bảo trì
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>

      <ContentSection
        title="Hoạt động gần đây"
        description="Cập nhật mới nhất từ các hoạt động của bạn"
      >
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Hoạt động gần đây sẽ hiển thị ở đây...
            </p>
          </CardContent>
        </Card>
      </ContentSection>
    </PageContainer>
  );
}
