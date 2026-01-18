"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateLand, useUpdateLand } from "@/hooks/use-customers";
import { createLandSchema } from "@/schemas/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { MapPin } from "lucide-react";
import type { z } from "zod";
import type { Land } from "@prisma/client";

type LandDialogProps = {
  open: boolean;
  onClose: () => void;
  customerId: string;
  initialData?: Land;
};

type CreateLandInput = z.infer<typeof createLandSchema>;

export function LandDialog({
  open,
  onClose,
  customerId,
  initialData,
}: LandDialogProps) {
  const createLand = useCreateLand();
  const updateLand = useUpdateLand();

  const form = useForm<CreateLandInput>({
    resolver: zodResolver(createLandSchema),
    defaultValues: {
      customer_id: customerId,
      name: "",
      gps_lat: undefined,
      gps_lng: undefined,
    },
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      form.reset({
        customer_id: customerId,
        name: initialData?.name || "",
        gps_lat: initialData?.gps_lat ? Number(initialData.gps_lat) : undefined,
        gps_lng: initialData?.gps_lng ? Number(initialData.gps_lng) : undefined,
      });
    }
  }, [open, initialData, customerId, form]);

  const onSubmit = async (data: CreateLandInput) => {
    if (initialData) {
      await updateLand.mutateAsync(
        { id: initialData.id, data: { name: data.name, gps_lat: data.gps_lat, gps_lng: data.gps_lng } },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      await createLand.mutateAsync(data, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const gpsLat = form.watch("gps_lat");
  const gpsLng = form.watch("gps_lng");
  const hasGPS = gpsLat !== undefined && gpsLng !== undefined && gpsLat !== null && gpsLng !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa thửa ruộng" : "Thêm thửa ruộng mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin thửa ruộng"
              : "Thêm thửa ruộng mới cho khách hàng"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên thửa ruộng *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Ruộng Đông" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* GPS Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gps_lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vĩ độ (Latitude)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="10.123456"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gps_lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kinh độ (Longitude)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="106.123456"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseFloat(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormDescription className="text-xs">
              Tọa độ GPS là tùy chọn. Bạn có thể thêm sau để xác định vị trí chính xác thửa ruộng.
            </FormDescription>

            {/* Google Maps Link */}
            {hasGPS && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(`https://www.google.com/maps?q=${gpsLat},${gpsLng}`, "_blank")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Xem trên Google Maps
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createLand.isPending || updateLand.isPending}
              >
                {initialData ? "Cập nhật" : "Thêm"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
