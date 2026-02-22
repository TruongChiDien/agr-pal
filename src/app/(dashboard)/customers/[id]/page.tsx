"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer, useDeleteCustomer } from "@/hooks/use-customers";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateCustomerDialog } from "@/components/customers/update-customer-dialog";
import { LandDialog } from "@/components/customers/land-dialog";

import { BookingList } from "@/components/bookings/booking-list";
import { BillList } from "@/components/bills/bill-list";
import { LandList } from "@/components/customers/land-list";


export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { data: customer, isLoading } = useCustomer(id);
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
  
  const [deleteCustomerDialogOpen, setDeleteCustomerDialogOpen] = useState(false);
  const [updateCustomerDialogOpen, setUpdateCustomerDialogOpen] = useState(false);
  
  const [landDialogOpen, setLandDialogOpen] = useState(false);


  const handleCloseDialog = () => {
    setLandDialogOpen(false);
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
  const calculateCurrentDebt = (bills?: any[]): number => {
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
            <Button variant="outline" onClick={() => setUpdateCustomerDialogOpen(true)}>
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
              <CardContent className="grid gap-8 md:grid-cols-2">
                {/* Column 1: Personal Info */}
                <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tên khách hàng</p>
                      <p className="font-medium">{customer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Số điện thoại</p>
                      <p className="font-medium">{customer.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Địa chỉ</p>
                      <p className="font-medium">{customer.address || "—"}</p>
                    </div>
                </div>

                {/* Column 2: Financial Info */}
                <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hóa đơn chưa trả</p>
                      <p className={`font-medium ${currentDebt > 0 ? "text-destructive" : ""}`}>
                        {formatCurrency(currentDebt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hóa đơn dự kiến</p>
                      <p className={`font-medium ${estimatedDebt > 0 ? "text-orange-600" : ""}`}>
                        {formatCurrency(estimatedDebt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng công nợ</p>
                      <p className={`font-bold ${totalDebt > 0 ? "text-destructive" : ""}`}>
                        {formatCurrency(totalDebt)}
                      </p>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Lands */}
          <TabsContent value="lands" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div>
                  <Button onClick={() => setLandDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thửa ruộng
                  </Button>
                </div>
              </div>

              <LandList customerId={id} />
            </div>
          </TabsContent>

          {/* Tab 3: Bookings */}
          <TabsContent value="bookings" className="mt-6">
            <div className="space-y-4">
              <BookingList customerId={id} />
            </div>
          </TabsContent>

          {/* Tab 4: Bills */}
          <TabsContent value="bills" className="mt-6">
            <div className="space-y-4">
              <BillList customerId={id} />
            </div>
          </TabsContent>
        </Tabs>
      </ContentSection>

      <LandDialog
        open={landDialogOpen}
        onClose={handleCloseDialog}
        customerId={id}
      />

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

      <UpdateCustomerDialog
        open={updateCustomerDialogOpen}
        onOpenChange={setUpdateCustomerDialogOpen}
        customer={customer as any}
      />

    </PageContainer>
  );
}
