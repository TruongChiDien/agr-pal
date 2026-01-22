"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useBooking, useUpdateBookingWithJobs } from "@/hooks/use-bookings";
import { useCustomers } from "@/hooks/use-customers";
import { updateBookingSchema } from "@/schemas/booking";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { BookingStatus } from "@/types/enums";
import { formatCurrency } from "@/lib/format";
import { z } from "zod";
import { checkBookingIncompleteJobs } from "@/actions/bookings";

type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export default function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { id } = use(params);
  const { data: booking, isLoading } = useBooking(id);
  const { data: customers } = useCustomers();
  const updateBookingWithJobs = useUpdateBookingWithJobs();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingData, setPendingData] = useState<UpdateBookingInput | null>(null);
  const [incompleteJobCount, setIncompleteJobCount] = useState(0);

  const form = useForm<UpdateBookingInput>({
    resolver: zodResolver(updateBookingSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      status: undefined,
      land_id: undefined,
      quantity: undefined,
      notes: "",
    },
  });

  // Pre-fill form when booking data loads
  useEffect(() => {
    if (booking) {
      form.reset({
        status: booking.status as BookingStatus,
        land_id: booking.land_id || undefined,
        quantity: booking.quantity ? Number(booking.quantity) : undefined,
        notes: booking.notes || "",
      });
    }
  }, [booking, form]);

  // Find selected customer's lands for the dropdown
  const customerLands = useMemo(() => {
    if (!booking || !customers) return [];
    const customer = customers.find((c) => c.id === booking.customer_id);
    return customer?.lands || [];
  }, [booking, customers]);

  // Watch quantity to calculate total
  const quantity = form.watch("quantity");
  const capturedPrice = booking ? Number(booking.captured_price) : 0;
  const totalAmount = (quantity || 0) * capturedPrice;

  const onSubmit = async (data: UpdateBookingInput) => {
    // Clean up empty optional fields
    const cleanedData = {
      ...data,
      land_id: data.land_id || undefined,
      quantity: data.quantity || undefined,
      notes: data.notes || undefined,
    };

    // If changing to COMPLETED, check for incomplete jobs
    if (cleanedData.status === BookingStatus.Completed && booking?.status !== BookingStatus.Completed) {
      const result = await checkBookingIncompleteJobs(id);
      if (result.success && result.data.hasIncompleteJobs) {
        // Show confirmation dialog
        setPendingData(cleanedData);
        setIncompleteJobCount(result.data.jobCount);
        setConfirmDialogOpen(true);
        return;
      }
    }

    // Normal update (no incomplete jobs or not completing)
    await updateBookingWithJobs.mutateAsync(
      { id, data: cleanedData, completeJobs: false },
      {
        onSuccess: () => router.push(redirectTo || `/bookings/${id}`),
      }
    );
  };

  const handleConfirmCompleteJobs = async () => {
    if (pendingData) {
      await updateBookingWithJobs.mutateAsync(
        { id, data: pendingData, completeJobs: true },
        {
          onSuccess: () => router.push(redirectTo || `/bookings/${id}`),
        }
      );
      setConfirmDialogOpen(false);
      setPendingData(null);
    }
  };

  const handleDeclineCompleteJobs = async () => {
    if (pendingData) {
      await updateBookingWithJobs.mutateAsync(
        { id, data: pendingData, completeJobs: false },
        {
          onSuccess: () => router.push(redirectTo || `/bookings/${id}`),
        }
      );
      setConfirmDialogOpen(false);
      setPendingData(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection
          title="Chỉnh sửa đơn hàng"
          description="Đang tải thông tin đơn hàng..."
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer>
        <ContentSection
          title="Không tìm thấy"
          description="Đơn hàng không tồn tại hoặc đã bị xóa"
          actions={
            <Button variant="outline" onClick={() => router.push("/bookings")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Button>
          }
        >
          <div className="text-center text-muted-foreground">
            Không tìm thấy đơn hàng
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  const isLocked = !!booking.bill_id;

  return (
    <PageContainer>
      <ContentSection
        title="Chỉnh sửa đơn hàng"
        description={`Cập nhật thông tin cho đơn hàng ${booking.id.slice(0, 8).toUpperCase()}`}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        {isLocked && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Đơn hàng này đã có hóa đơn. Một số trường không thể chỉnh sửa để
              đảm bảo tính nhất quán của dữ liệu.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            {/* Readonly Fields */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{booking.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dịch vụ</p>
                <p className="font-medium">{booking.service.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá ghi nhận</p>
                <p className="font-medium">{formatCurrency(capturedPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng giá trị (tính toán)</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>

            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLocked}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={BookingStatus.New}>Mới</SelectItem>
                      <SelectItem value={BookingStatus.InProgress}>
                        Đang xử lý
                      </SelectItem>
                      <SelectItem value={BookingStatus.Completed}>
                        Hoàn thành
                      </SelectItem>
                      <SelectItem value={BookingStatus.Blocked}>
                        Bị chặn
                      </SelectItem>
                      <SelectItem value={BookingStatus.Canceled}>
                        Đã hủy
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {isLocked && (
                    <FormDescription className="text-amber-600">
                      Trường này bị khóa vì đơn hàng đã có hóa đơn
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Land Field */}
            <FormField
              control={form.control}
              name="land_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thửa ruộng</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // Convert "NONE" back to undefined
                      field.onChange(value === "NONE" ? undefined : value);
                    }}
                    value={field.value || "NONE"}
                    disabled={isLocked}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thửa ruộng (tùy chọn)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">
                        <span className="text-muted-foreground">Không chọn</span>
                      </SelectItem>
                      {customerLands.map((land) => (
                        <SelectItem key={land.id} value={land.id}>
                          {land.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {customerLands.length === 0
                      ? "Khách hàng này chưa có thửa ruộng nào"
                      : "Chọn thửa ruộng hoặc để trống"}
                  </FormDescription>
                  <FormMessage />
                  {isLocked && (
                    <FormDescription className="text-amber-600">
                      Trường này bị khóa vì đơn hàng đã có hóa đơn
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Quantity Field */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Số lượng ({booking.service.unit})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="VD: 100"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : Number(value));
                      }}
                      disabled={isLocked}
                    />
                  </FormControl>
                  <FormDescription>
                    Để trống nếu chưa xác định được số lượng
                  </FormDescription>
                  <FormMessage />
                  {isLocked && (
                    <FormDescription className="text-amber-600">
                      Trường này bị khóa vì đơn hàng đã có hóa đơn
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập ghi chú về đơn hàng (nếu có)"
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={updateBookingWithJobs.isPending || isLocked}>
                {updateBookingWithJobs.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Form>
      </ContentSection>

      {/* Confirmation Dialog for Completing Jobs */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành các công việc?</DialogTitle>
            <DialogDescription>
              Đơn hàng này có {incompleteJobCount} công việc chưa hoàn thành (trạng thái Mới hoặc Đang xử lý).
              <br />
              <br />
              Bạn có muốn đánh dấu tất cả các công việc này là Hoàn thành không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeclineCompleteJobs}
              disabled={updateBookingWithJobs.isPending}
            >
              Không, chỉ cập nhật đơn hàng
            </Button>
            <Button
              onClick={handleConfirmCompleteJobs}
              disabled={updateBookingWithJobs.isPending}
            >
              {updateBookingWithJobs.isPending ? "Đang cập nhật..." : "Có, hoàn thành tất cả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
