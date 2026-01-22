"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkers, useDeleteWorker } from "@/hooks/use-workers";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/format";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Worker, Worker_Weight } from "@prisma/client";

type WorkerWithRelations = Worker & {
  worker_weights?: Worker_Weight[];
  jobs?: { id: string; status: string }[];
};

export default function WorkersPage() {
  const router = useRouter();
  const { data: workers, isLoading } = useWorkers();
  const deleteWorker = useDeleteWorker();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    setWorkerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (workerToDelete) {
      await deleteWorker.mutateAsync(workerToDelete);
      setDeleteDialogOpen(false);
      setWorkerToDelete(null);
    }
  };

  // Filter data by search query
  const filteredData = workers
    ? workers.filter((worker) =>
        worker.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Sort data
  const sortedData = filteredData.sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = (a as any)[sortKey];
    const bValue = (b as any)[sortKey];

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue, "vi-VN")
        : bValue.localeCompare(aValue, "vi-VN");
    }

    return 0;
  });

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const columns: ColumnDef<WorkerWithRelations>[] = [
    {
      key: "name",
      label: "Tên công nhân",
      sortable: true,
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "phone",
      label: "Số điện thoại",
      sortable: true,
      width: "150px",
      render: (item) => (
        <span className="text-muted-foreground">{item.phone || "—"}</span>
      ),
    },
    {
      key: "worker_weights",
      label: "Hệ số lương",
      width: "140px",
      render: (item) => (
        <Badge variant="secondary">
          {item.worker_weights?.length || 0} loại công việc
        </Badge>
      ),
    },
    {
      key: "jobs",
      label: "Số công việc",
      width: "120px",
      align: "right",
      render: (item) => {
        // Count only non-completed jobs
        const notCompletedJobsCount = item.jobs?.filter(job => ["NEW", "IN_PROGRESS"].includes(job.status)).length || 0;
        return (
          <span className="text-muted-foreground">
            {notCompletedJobsCount}
          </span>
        );
      },
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      sortable: true,
      width: "120px",
      render: (item) => formatDateShort(item.created_at),
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
              router.push(`/workers/${item.id}/edit?redirect=${encodeURIComponent(`/workers/${item.id}`)}`);
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
          title="Quản lý công nhân"
          description="Danh sách công nhân và hệ số lương"
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
        title="Quản lý công nhân"
        description="Danh sách công nhân và hệ số lương"
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-8 w-[250px]"
              />
            </div>
            <Button onClick={() => router.push("/workers/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo mới
            </Button>
          </div>
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
          onRowClick={(item) => router.push(`/workers/${item.id}`)}
          getRowId={(item) => item.id}
        />
      </ContentSection>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa công nhân này? Hành động này không thể hoàn tác.
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
    </PageContainer>
  );
}
