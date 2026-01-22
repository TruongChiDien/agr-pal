"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer, useDeleteLand, useDeleteCustomer } from "@/hooks/use-customers";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LandDialog } from "@/components/customers/land-dialog";
import { StatusBadge } from "@/components/status/status-badge";
import { BookingStatus, BillStatus, PaymentStatus } from "@/types/enums";
import type { Land, Booking, Bill } from "@/types";

type LandWithRelations = Omit<Land, 'gps_lat' | 'gps_lng'> & {
  gps_lat: number | null;
  gps_lng: number | null;
};

type BookingWithRelations = Omit<Booking, 'quantity' | 'captured_price' | 'total_amount'> & {
  quantity: number | null;
  captured_price: number;
  total_amount: number;
  service?: { name: string };
  land?: { name: string };
};

type BillWithRelations = Omit<Bill, 'total_amount' | 'total_paid' | 'discount_amount' | 'subtotal'> & {
  total_amount: number;
  total_paid: number;
  discount_amount: number;
  subtotal: number;
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { data: customer, isLoading } = useCustomer(id);
  const deleteLand = useDeleteLand();
  const deleteCustomer = useDeleteCustomer();

  // Read tab from URL, default to "info"
  const tabFromUrl = searchParams.get("tab") || "info";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync activeTab with URL parameter
  useEffect(() => {
    const urlTab = searchParams.get("tab") || "info";
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`/customers/${id}?${params.toString()}`, { scroll: false });
  };
  const [landDialogOpen, setLandDialogOpen] = useState(false);
  const [editingLand, setEditingLand] = useState<LandWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [landToDelete, setLandToDelete] = useState<string | null>(null);
  const [deleteCustomerDialogOpen, setDeleteCustomerDialogOpen] = useState(false);

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

  const handleDeleteCustomerConfirm = async () => {
    await deleteCustomer.mutateAsync(id, {
      onSuccess: () => {
        setDeleteCustomerDialogOpen(false);
        router.push("/customers");
      },
    });
  };

  // Calculate current debt from bills (remaining unpaid amount)
  const calculateCurrentDebt = (bills?: BillWithRelations[]): number => {
    if (!bills) return 0;
    return bills
      .filter((b) => b.status !== "COMPLETED")
      .reduce((sum, b) => {
        const totalAmount = Number(b.total_amount);
        const totalPaid = Number(b.total_paid);
        return sum + (totalAmount - totalPaid);
      }, 0);
  };

  // Calculate estimated debt from pending bookings (not yet in bills)
  const calculateEstimatedDebt = (bookings?: Array<{ payment_status: string; total_amount: number | string }>): number => {
    if (!bookings) return 0;
    return bookings
      .filter((b) => b.payment_status === "PENDING_BILL")
      .reduce((sum, b) => sum + Number(b.total_amount), 0);
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

  // Bookings columns
  const bookingColumns: ColumnDef<BookingWithRelations>[] = [
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "110px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">{formatDateShort(item.created_at)}</span>
      ),
    },
    {
      key: "service",
      label: "Dịch vụ",
      render: (item) => <span className="font-medium">{item.service?.name || "—"}</span>,
    },
    {
      key: "land",
      label: "Thửa ruộng",
      render: (item) => <span className="text-muted-foreground">{item.land?.name || "—"}</span>,
    },
    {
      key: "total_price",
      label: "Tổng tiền",
      align: "right",
      width: "120px",
      render: (item) => (
        <span className="font-semibold">{formatCurrency(Number(item.total_amount))}</span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      width: "130px",
      render: (item) => {
        const getVariant = () => {
          switch (item.status) {
            case BookingStatus.New: return "new";
            case BookingStatus.InProgress: return "in-progress";
            case BookingStatus.Completed: return "completed";
            case BookingStatus.Canceled: return "cancelled";
            default: return "new";
          }
        };
        const getLabel = () => {
          switch (item.status) {
            case BookingStatus.New: return "Mới";
            case BookingStatus.InProgress: return "Đang xử lý";
            case BookingStatus.Completed: return "Hoàn thành";
            case BookingStatus.Canceled: return "Đã hủy";
            default: return item.status;
          }
        };
        return <StatusBadge variant={getVariant() as any} label={getLabel()} />;
      },
    },
    {
      key: "payment_status",
      label: "Thanh toán",
      width: "130px",
      render: (item) => {
        const getVariant = (): "pending" | "partial" | "paid" => {
          switch (item.payment_status) {
            case PaymentStatus.PendingBill: return "pending";
            case PaymentStatus.AddedBill: return "partial";
            case PaymentStatus.FullyPaid: return "paid";
            default: return "pending";
          }
        };
        const getLabel = () => {
          switch (item.payment_status) {
            case PaymentStatus.PendingBill: return "Chưa tạo hóa đơn";
            case PaymentStatus.AddedBill: return "Đã tạo hóa đơn";
            case PaymentStatus.FullyPaid: return "Đã thanh toán";
            default: return item.payment_status;
          }
        };
        return <StatusBadge variant={getVariant()} label={getLabel()} />;
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
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/bookings/${item.id}/edit?redirect=${encodeURIComponent(`/customers/${id}?tab=bookings`)}`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/bookings/${item.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Bills columns
  const billColumns: ColumnDef<BillWithRelations>[] = [
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "110px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">{formatDateShort(item.created_at)}</span>
      ),
    },
    {
      key: "total_amount",
      label: "Tổng tiền",
      align: "right",
      width: "130px",
      render: (item) => (
        <span className="font-semibold">{formatCurrency(item.total_amount)}</span>
      ),
    },
    {
      key: "total_paid",
      label: "Đã thu",
      align: "right",
      width: "130px",
      render: (item) => (
        <span className="text-muted-foreground">{formatCurrency(item.total_paid)}</span>
      ),
    },
    {
      key: "balance",
      label: "Còn lại",
      align: "right",
      width: "130px",
      render: (item) => {
        const balance = item.total_amount - item.total_paid;
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
      render: (item) => {
        const getVariant = () => {
          switch (item.status) {
            case BillStatus.Open: return "open";
            case BillStatus.PartialPaid: return "partial";
            case BillStatus.Completed: return "completed";
            default: return "open";
          }
        };
        const getLabel = () => {
          switch (item.status) {
            case BillStatus.Open: return "Chưa thu";
            case BillStatus.PartialPaid: return "Thu 1 phần";
            case BillStatus.Completed: return "Hoàn thành";
            default: return item.status;
          }
        };
        return <StatusBadge variant={getVariant() as any} label={getLabel()} />;
      },
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      align: "right",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/bills/${item.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
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

  const estimatedDebt = calculateEstimatedDebt(customer.bookings);
  const currentDebt = calculateCurrentDebt(customer.bills);
  const totalDebt = estimatedDebt + currentDebt;

  return (
    <PageContainer>
      <ContentSection
        title={customer.name}
        description="Thông tin chi tiết khách hàng"
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => setDeleteCustomerDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
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
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
                  <p className="text-sm text-muted-foreground">Công nợ dự kiến</p>
                  <p className={`font-semibold ${estimatedDebt > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
                    {formatCurrency(estimatedDebt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Công nợ hiện tại</p>
                  <p className={`font-semibold ${currentDebt > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatCurrency(currentDebt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng công nợ</p>
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

          {/* Tab 3: Bookings */}
          <TabsContent value="bookings" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => router.push(`/bookings/new?customer_id=${id}&redirect=${encodeURIComponent(`/customers/${id}?tab=bookings`)}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm đơn hàng
                </Button>
              </div>

              {customer.bookings && customer.bookings.length > 0 ? (
                <DataTable
                  columns={bookingColumns}
                  data={customer.bookings as unknown as BookingWithRelations[]}
                  getRowId={(item) => item.id}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground mb-4">
                      Chưa có đơn hàng nào
                    </p>
                    <Button onClick={() => router.push(`/bookings/new?customer_id=${id}&redirect=${encodeURIComponent(`/customers/${id}?tab=bookings`)}`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm đơn hàng đầu tiên
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 4: Bills */}
          <TabsContent value="bills" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => router.push(`/bills/new?customer_id=${id}&redirect=${encodeURIComponent(`/customers/${id}?tab=bills`)}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm hóa đơn
                </Button>
              </div>

              {customer.bills && customer.bills.length > 0 ? (
                <DataTable
                  columns={billColumns}
                  data={customer.bills}
                  getRowId={(item) => item.id}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-48">
                    <p className="text-muted-foreground mb-4">
                      Chưa có hóa đơn nào
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Công nợ hiện tại:{" "}
                      <span className={`font-bold ${currentDebt > 0 ? "text-destructive" : ""}`}>
                        {formatCurrency(currentDebt)}
                      </span>
                    </p>
                    <Button onClick={() => router.push(`/bills/new?customer_id=${id}&redirect=${encodeURIComponent(`/customers/${id}?tab=bills`)}`)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm hóa đơn đầu tiên
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </ContentSection>

      {/* Land Dialog - will be replaced in Step 2.3 */}
      <LandDialog
        open={landDialogOpen}
        onClose={handleCloseDialog}
        customerId={id}
        initialData={editingLand as any || undefined}
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

      {/* Delete Customer Confirmation Dialog */}
      <Dialog open={deleteCustomerDialogOpen} onOpenChange={setDeleteCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa khách hàng "{customer.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCustomerDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCustomerConfirm}
              disabled={deleteCustomer.isPending}
            >
              {deleteCustomer.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
