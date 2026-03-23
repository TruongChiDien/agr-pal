"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useMachineTypes, useDeleteMachineType } from "@/hooks/use-machine-types"
import { DataTable } from "@/components/data-display/data-table/data-table"
import type { ColumnDef } from "@/components/data-display/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MachineTypesClient } from "@/components/machine-types/machine-types-client"
import { MachineTypeDetailSheet } from "@/components/machine-types/machine-type-detail-sheet"
import { formatCurrency } from "@/lib/format"
import type { MachineType, Job_Type } from "@prisma/client"

type MachineTypeRow = MachineType & {
  job_types: Job_Type[]
  _count: { machines: number }
}

export default function MachineTypesPage() {
  const { data: machineTypes = [], isLoading } = useMachineTypes()
  const deleteMachineType = useDeleteMachineType()

  const [selectedMt, setSelectedMt] = useState<MachineTypeRow | null>(null)
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

  const sorted = [...(machineTypes as MachineTypeRow[])].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0
    if (sortKey === "name") {
      const cmp = a.name.localeCompare(b.name, "vi-VN")
      return sortDirection === "asc" ? cmp : -cmp
    }
    return 0
  })

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const columns: ColumnDef<MachineTypeRow>[] = [
    {
      key: "name",
      label: "Tên loại máy",
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-medium">{item.name}</span>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[240px]">
              {item.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "job_types",
      label: "Loại công việc",
      render: (item) =>
        item.job_types.length === 0 ? (
          <span className="text-muted-foreground text-sm italic">Chưa có</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {item.job_types.map((jt) => (
              <Badge key={jt.id} variant="secondary" className="text-xs font-normal">
                {jt.name} · {formatCurrency(Number(jt.default_base_salary))}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: "machines",
      label: "Số máy",
      width: "80px",
      align: "center",
      render: (item) => <Badge variant="outline">{item._count.machines}</Badge>,
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
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation()
            setDeleteId(item.id)
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loại máy</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quản lý loại máy và các loại công việc tương ứng. Nhấn vào hàng để xem chi tiết.
          </p>
        </div>
        <MachineTypesClient />
      </div>

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
        onRowClick={(item) => setSelectedMt(item)}
        getRowId={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="Chưa có loại máy nào"
        emptyDescription="Nhấn 'Tạo loại máy mới' để thêm"
      />

      {/* Detail dialog: manage job types for selected machine type */}
      {selectedMt && (
        <MachineTypeDetailSheet
          machineType={selectedMt}
          open={!!selectedMt}
          onClose={() => setSelectedMt(null)}
        />
      )}

      {/* Delete machine type confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Xóa loại máy này sẽ xóa tất cả loại công việc liên quan. Không thể xóa nếu đang
              có máy sử dụng loại máy này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMachineType.isPending}
              onClick={async () => {
                if (deleteId) {
                  await deleteMachineType.mutateAsync(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              {deleteMachineType.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
