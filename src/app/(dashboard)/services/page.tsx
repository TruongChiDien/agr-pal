"use client"

import { useState } from "react"
import { useServices, useDeleteService } from "@/hooks/use-services"
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table"
import { PageContainer, ContentSection } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { CreateServiceDialog } from "@/components/services/create-service-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/format"

type ServiceRow = {
  id: string
  name: string
  unit: string
  price: unknown
  description: string | null
  machine_types: { machine_type_id: string; machine_type: { name: string } }[]
}

export default function ServicesPage() {
  const { data: services = [], isLoading } = useServices()
  const deleteService = useDeleteService()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sortKey, setSortKey] = useState("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("asc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const sorted = [...services].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0
    if (sortKey === "name") {
      return sortDirection === "asc"
        ? a.name.localeCompare(b.name, "vi-VN")
        : b.name.localeCompare(a.name, "vi-VN")
    }
    if (sortKey === "price") {
      const diff = Number(a.price) - Number(b.price)
      return sortDirection === "asc" ? diff : -diff
    }
    return 0
  })

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const columns: ColumnDef<ServiceRow>[] = [
    {
      key: "name",
      label: "Tên dịch vụ",
      sortable: true,
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "price",
      label: "Đơn giá",
      sortable: true,
      width: "160px",
      align: "right",
      render: (item) => (
        <span className="font-medium">
          {formatCurrency(Number(item.price))}/{item.unit}
        </span>
      ),
    },
    {
      key: "machine_types",
      label: "Loại máy",
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.machine_types.length === 0 ? (
            <span className="text-muted-foreground text-sm">—</span>
          ) : (
            item.machine_types.map((smt) => (
              <Badge key={smt.machine_type_id} variant="secondary" className="text-xs">
                {smt.machine_type.name}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      key: "description",
      label: "Mô tả",
      render: (item) => (
        <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
          {item.description || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "60px",
      align: "right",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await deleteService.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <PageContainer>
      <ContentSection
        title="Dịch vụ"
        description="Quản lý danh mục dịch vụ nông nghiệp"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo dịch vụ mới
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={paginated}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={sorted.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          getRowId={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="Chưa có dịch vụ nào"
          emptyDescription="Thêm dịch vụ nông nghiệp đầu tiên"
        />
      </ContentSection>

      <CreateServiceDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>Bạn có chắc muốn xóa dịch vụ này?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteService.isPending}
            >
              {deleteService.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
