"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomer, useDeleteLand } from "@/hooks/use-customers";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, Plus, Edit, Trash2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LandDialog } from "@/components/customers/land-dialog";
import type { Land, Booking, Bill } from "@prisma/client";

type LandWithRelations = Land;

type BookingWithRelations = Booking & {
  service?: { name: string };
  land?: { name: string };
};

type BillWithRelations = Bill;

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: customer, isLoading } = useCustomer(id);
  const deleteLand = useDeleteLand();

  const [activeTab, setActiveTab] = useState("info");
  const [landDialogOpen, setLandDialogOpen] = useState(false);
  const [editingLand, setEditingLand] = useState<LandWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [landToDelete, setLandToDelete] = useState<string | null>(null);

  const handleDeleteLandClick = (landId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLandToDelete(landId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteLandConfirm = async () => {
    if (landToDelete) {
      await deleteLand.mutateAsync(landToDelete);
      setDeleteDialogOpen(false);
      setLandToDelete(null);
    }
  };

  const handleEditLand = (land: LandWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLand(land);
    setLandDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setLandDialogOpen(false);
    setEditingLand(null);
  };

  // Calculate total debt from bills
  const calculateDebt = (bills?: BillWithRelations[]): number => {
    if (!bills) return 0;
    return bills
      .filter((b) => b.status !== "COMPLETED")
      .reduce((sum, b) => {
        const totalAmount = Number(b.total_amount);
        const totalPaid = Number(b.total_paid);
        return sum + (totalAmount - totalPaid);
      }, 0);
  };

  const landColumns: ColumnDef<LandWithRelations>[] = [
    {
      key: "name",
      label: "Tên thửa ruộng",
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "gps_lat",
      label: "Vĩ độ (Latitude)",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-muted-foreground font-mono text-xs">
          {item.gps_lat?.toFixed(6) || "—"}
        </span>
      ),
    },
    {
      key: "gps_lng",
      label: "Kinh độ (Longitude)",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-muted-foreground font-mono text-xs">
          {item.gps_lng?.toFixed(6) || "—"}
        </span>
      ),
    },
    {
      key: "gps_link",
      label: "",
      width: "120px",
      align: "center",
      render: (item) => {
        if (!item.gps_lat || !item.gps_lng) return null;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                `https://www.google.com/maps?q=${item.gps_lat},${item.gps_lng}`,
                "_blank"
              );
            }}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Xem bản đồ
          </Button>
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
            onClick={(e) => handleEditLand(item, e)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteLandClick(item.id, e)}
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
        <ContentSection title="Chi tiết khách hàng" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer>
        <ContentSection title="Không tìm thấy" description="Khách hàng không tồn tại">
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </ContentSection>
      </PageContainer>
    );
  }

  const totalDebt = calculateDebt(customer.bills);

  return (
    <PageContainer>
      <ContentSection
        title={customer.name}
        description="Thông tin chi tiết khách hàng"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/customers/${id}/edit`)}>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="lands">
              Thửa ruộng ({customer.lands?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="bookings">
              Đơn hàng ({customer.bookings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="bills">
              Hóa đơn ({customer.bills?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Customer Info */}
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tên</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{customer.phone || "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{customer.address || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số thửa ruộng</p>
                  <p className="font-medium">
                    <Badge variant="secondary">
                      {customer.lands?.length || 0} thửa
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Công nợ</p>
                  <p className={`font-bold ${totalDebt > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatCurrency(totalDebt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Lands */}
          <TabsContent value="lands" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Danh sách thửa ruộng</h3>
                  <p className="text-sm text-muted-foreground">
                    Quản lý thông tin thửa ruộng và tọa độ GPS
                  </p>
                </div>
                <Button onClick={() => setLandDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm thửa ruộng
                </Button>
              </div>

              {customer.lands && customer.lands.length > 0 ? (
                <DataTable
                  columns={landColumns}
                  data={customer.lands}
                  getRowId={(item) => item.id}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground mb-4">
                      Chưa có thửa ruộng nào
                    </p>
                    <Button onClick={() => setLandDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm thửa ruộng đầu tiên
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Bookings (Future) */}
          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tổng số đơn hàng: {customer.bookings?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  (Chức năng chi tiết sẽ được bổ sung sau)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Bills (Future) */}
          <TabsContent value="bills" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hóa đơn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tổng số hóa đơn: {customer.bills?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Công nợ hiện tại:{" "}
                  <span className={`font-bold ${totalDebt > 0 ? "text-destructive" : ""}`}>
                    {formatCurrency(totalDebt)}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  (Chức năng chi tiết sẽ được bổ sung sau)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ContentSection>

      {/* Land Dialog - will be replaced in Step 2.3 */}
      <LandDialog
        open={landDialogOpen}
        onClose={handleCloseDialog}
        customerId={id}
        initialData={editingLand || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa thửa ruộng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteLandConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
