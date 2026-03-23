"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMachines, useDeleteMachine } from "@/hooks/use-machines";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/format";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Machine } from "@prisma/client";
import { MachineStatus } from "@/types/enums";
import { CreateMachineDialog } from "@/components/machines/create-machine-dialog";
import { UpdateMachineDialog } from "@/components/machines/update-machine-dialog";

const statusConfig = {
  [MachineStatus.Available]: { bg: "bg-green-100", text: "text-green-700", label: "Sẵn sàng" },
  [MachineStatus.InUse]: { bg: "bg-blue-100", text: "text-blue-700", label: "Đang sử dụng" },
  [MachineStatus.Maintenance]: { bg: "bg-orange-100", text: "text-orange-700", label: "Bảo trì" },
};

export default function MachinesPage() {
  const router = useRouter();
  const { data: machines, isLoading } = useMachines();
  const deleteMachine = useDeleteMachine();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<string | null>(null);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey("");
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMachineToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (machineToDelete) {
      await deleteMachine.mutateAsync(machineToDelete);
      setDeleteDialogOpen(false);
      setMachineToDelete(null);
    }
  };

  // Sort data
  const sortedData = machines ? [...machines].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = (a as any)[sortKey];
    const bValue = (b as any)[sortKey];

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue, "vi-VN")
        : bValue.localeCompare(aValue, "vi-VN");
    }

    return 0;
  }) : [];

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const columns: ColumnDef<Machine>[] = [
    {
      key: "name",
      label: "Tên máy",
      sortable: true,
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "model",
      label: "Model",
      sortable: true,
      width: "150px",
      render: (item) => item.model || "-",
    },
    {
      key: "machine_type",
      label: "Loại",
      sortable: true,
      width: "150px",
      render: (item: any) => item.machine_type?.name || "-",
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      width: "150px",
      align: "center",
      render: (item) => {
        const config = statusConfig[item.status as MachineStatus];
        return (
          <Badge className={`${config.bg} ${config.text} border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "purchase_date",
      label: "Ngày mua",
      sortable: true,
      width: "120px",
      render: (item) => item.purchase_date ? formatDateShort(item.purchase_date) : "-",
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
              setMachineToEdit(item);
              setEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(item.id, e)}
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
        <ContentSection
          title="Quản lý máy móc"
          description="Danh sách máy móc nông nghiệp"
        >
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Quản lý máy móc"
        description="Danh sách máy móc nông nghiệp"
        actions={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo mới
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={paginatedData}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={Math.ceil(sortedData.length / pageSize)}
          totalItems={sortedData.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={(item) => router.push(`/machines/${item.id}`)}
          getRowId={(item) => item.id}
        />
      </ContentSection>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa máy này? Hành động này không thể hoàn tác.
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
      
      <CreateMachineDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      
      {machineToEdit && (
        <UpdateMachineDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            machine={machineToEdit}
        />
      )}
    </PageContainer>
  );
}
