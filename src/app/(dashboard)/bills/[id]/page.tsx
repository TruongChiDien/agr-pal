"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useBill } from "@/hooks/use-bills";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status/status-badge";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { BillPaymentHistory } from "@/components/bills/bill-payment-history";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ArrowLeft, Plus } from "lucide-react";
import { BillStatus } from "@/types/enums";
import type { Booking, Land, Service, BillPayment } from "@prisma/client";

type BookingWithRelations = Booking & {
  land: Land | null;
  service: Service;
};

// Map bill status to badge variant
function getBillStatusVariant(
  status: string
): "open" | "partial" | "completed" {
  switch (status) {
    case BillStatus.Open:
      return "open";
    case BillStatus.PartialPaid:
      return "partial";
    case BillStatus.Completed:
      return "completed";
    default:
      return "open";
  }
}

// Map bill status to label
function getBillStatusLabel(status: string): string {
  switch (status) {
    case BillStatus.Open:
      return "Chưa thu";
    case BillStatus.PartialPaid:
      return "Thu 1 phần";
    case BillStatus.Completed:
      return "Hoàn thành";
    default:
      return status;
  }
}

export default function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: bill, isLoading } = useBill(id);

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Chi tiết hóa đơn" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!bill) {
    return (
      <PageContainer>
        <ContentSection title="Không tìm thấy" description="Hóa đơn không tồn tại">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <p className="text-muted-foreground">Hóa đơn không tồn tại hoặc đã bị xóa</p>
            <Button onClick={() => router.push("/bills")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const subtotal = Number(bill.subtotal);
  const discountAmount = Number(bill.discount_amount);
  const totalAmount = Number(bill.total_amount);
  const totalPaid = Number(bill.total_paid);
  const balance = totalAmount - totalPaid;

  const bookings = (bill.bookings || []) as BookingWithRelations[];

  const bookingColumns: ColumnDef<BookingWithRelations>[] = [
    {
      key: "land",
      label: "Ruộng",
      width: "150px",
      render: (item) => (
        <span className="text-sm">
          {item.land?.name || "Chưa chọn"}
        </span>
      ),
    },
    {
      key: "service",
      label: "Dịch vụ",
      width: "200px",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{item.service.name}</span>
          <span className="text-xs text-muted-foreground">
            {Number(item.quantity)} {item.service.unit}
          </span>
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Giá trị",
      align: "right",
      width: "140px",
      render: (item) => (
        <span className="text-sm font-semibold">
          {formatCurrency(Number(item.total_amount))}
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
        title="Chi tiết hóa đơn"
        description={`Hóa đơn cho ${bill.customer.name}`}
        actions={
          <Button variant="outline" onClick={() => router.push("/bills")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Bill Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hóa đơn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="text-lg font-medium">{bill.customer.name}</p>
                  {bill.customer.phone && (
                    <p className="text-sm text-muted-foreground">{bill.customer.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày tạo</p>
                  <p className="text-lg font-medium">{formatDateShort(bill.created_at)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Tổng tiền hàng</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(subtotal)}
                    </p>
                  </div>

                  {/* Discount (only show if > 0) */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Giảm giá</p>
                        {bill.discount_reason && (
                          <p className="text-xs text-muted-foreground italic">
                            ({bill.discount_reason})
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-destructive">
                        - {formatCurrency(discountAmount)}
                      </p>
                    </div>
                  )}

                  {/* Total Amount (after discount) */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-sm font-medium">Tổng tiền</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>

                  {/* Amount Paid */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Đã thu</p>
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
                    variant={getBillStatusVariant(bill.status)}
                    label={getBillStatusLabel(bill.status)}
                  />
                </div>
                {balance > 0 && (
                  <Button onClick={() => router.push(`/bills/${id}/add-payment`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thanh toán
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bookings in Bill */}
          <Card>
            <CardHeader>
              <CardTitle>Các đơn hàng trong hóa đơn ({bookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Không có đơn hàng nào
                </p>
              ) : (
                <DataTable
                  columns={bookingColumns}
                  data={bookings}
                  currentPage={1}
                  pageSize={100}
                  totalPages={1}
                  totalItems={bookings.length}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  sortKey=""
                  sortDirection={null}
                  onSort={() => {}}
                  getRowId={(item) => item.id}
                  onRowClick={(item) => router.push(`/bookings/${item.id}`)}
                  emptyMessage="Không có đơn hàng"
                  emptyDescription=""
                />
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <BillPaymentHistory payments={(bill.payments || []) as BillPayment[]} />
        </div>
      </ContentSection>
    </PageContainer>
  );
}
