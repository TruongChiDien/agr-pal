"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteLand } from "@/hooks/use-customers";
import { useCustomer } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Edit, Trash2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Land } from "@/types";
import { LandDialog } from "@/components/customers/land-dialog";

type LandWithRelations = Omit<Land, 'gps_lat' | 'gps_lng'> & {
  gps_lat: number | null;
  gps_lng: number | null;
};

interface LandListProps {
  customerId: string;
  onEdit?: (land: LandWithRelations) => void;
  onDelete?: (land: LandWithRelations) => void;
}

export function LandList({ customerId, onEdit, onDelete }: LandListProps) {
  const router = useRouter();
  
  // Data fetching logic
  const { data: customer, isLoading } = useCustomer(customerId);
  const lands = (customer?.lands as unknown as LandWithRelations[]) || [];

  const deleteLand = useDeleteLand();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [landToDelete, setLandToDelete] = useState<string | null>(null);
  const [landDialogOpen, setLandDialogOpen] = useState(false);
  const [editingLand, setEditingLand] = useState<LandWithRelations | null>(null);

  const handleDeleteClick = (land: LandWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
        onDelete(land);
    } else {
        setLandToDelete(land.id);
        setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (landToDelete) {
      await deleteLand.mutateAsync(landToDelete);
      setDeleteDialogOpen(false);
      setLandToDelete(null);
    }
  };

  const handleEditClick = (land: LandWithRelations, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
        onEdit(land);
    } else {
        setEditingLand(land);
        setLandDialogOpen(true);
    }
  };

  const handleCloseDialog = () => {
    setLandDialogOpen(false);
    setEditingLand(null);
  };

  const columns: ColumnDef<LandWithRelations>[] = [
    {
      key: "name",
      label: "Tên thửa ruộng",
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "gps_lat",
      label: "Vĩ độ (Latitude)",
      align: "right",
      width: "200px",
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
      width: "200px",
      render: (item) => (
        <span className="text-muted-foreground font-mono text-xs">
          {item.gps_lng?.toFixed(6) || "—"}
        </span>
      ),
    },
    {
      key: "gps_link",
      label: "",
      width: "200px",
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
            onClick={(e) => handleEditClick(item, e)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(item, e)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
        </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={lands}
        getRowId={(item) => item.id}
        emptyMessage="Chưa có thửa ruộng nào"
        emptyDescription="Thêm thửa ruộng đầu tiên để bắt đầu"
      />

      <LandDialog
        open={landDialogOpen}
        onClose={handleCloseDialog}
        customerId={customerId}
        initialData={editingLand as any || undefined}
      />

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
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
