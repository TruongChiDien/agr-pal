"use client"

import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useCreateJobType,
  useUpdateJobType,
  useDeleteJobType,
  useMachineTypes,
} from "@/hooks/use-machine-types"
import { JobTypeInlineForm } from "./job-type-inline-form"
import { formatCurrency } from "@/lib/format"
import type { MachineType, Job_Type } from "@prisma/client"

type MachineTypeWithJobTypes = MachineType & {
  job_types: Job_Type[]
  _count: { machines: number }
}

interface MachineTypeDetailSheetProps {
  machineType: MachineTypeWithJobTypes
  open: boolean
  onClose: () => void
}

export function MachineTypeDetailSheet({
  machineType,
  open,
  onClose,
}: MachineTypeDetailSheetProps) {
  // Use live query data so the list refreshes after mutations
  const { data: machineTypes = [] } = useMachineTypes()
  const liveMt =
    (machineTypes.find((mt) => mt.id === machineType.id) as MachineTypeWithJobTypes | undefined) ??
    machineType

  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const createJobType = useCreateJobType()
  const updateJobType = useUpdateJobType()
  const deleteJobType = useDeleteJobType()

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{liveMt.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span>{liveMt.description || "Quản lý loại công việc cho loại máy này"}</span>
              <Badge variant="outline" className="ml-1">
                {liveMt._count.machines} máy
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Loại công việc</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setAddingNew(true); setEditingId(null) }}
                disabled={addingNew}
              >
                <Plus className="h-3 w-3 mr-1" />
                Thêm
              </Button>
            </div>

            {addingNew && (
              <JobTypeInlineForm
                onSave={async (data) => {
                  const result = await createJobType.mutateAsync({
                    machine_type_id: liveMt.id,
                    data,
                  })
                  if (result.success) setAddingNew(false)
                }}
                onCancel={() => setAddingNew(false)}
                isLoading={createJobType.isPending}
              />
            )}

            <div className="space-y-1.5">
              {liveMt.job_types.length === 0 && !addingNew && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có loại công việc nào
                </p>
              )}

              {liveMt.job_types.map((jt) =>
                editingId === jt.id ? (
                  <JobTypeInlineForm
                    key={jt.id}
                    initialData={{
                      name: jt.name,
                      default_base_salary: Number(jt.default_base_salary),
                    }}
                    onSave={async (data) => {
                      const result = await updateJobType.mutateAsync({ id: jt.id, data })
                      if (result.success) setEditingId(null)
                    }}
                    onCancel={() => setEditingId(null)}
                    isLoading={updateJobType.isPending}
                  />
                ) : (
                  <div
                    key={jt.id}
                    className="flex items-center justify-between p-2.5 rounded-md border bg-card"
                  >
                    <div>
                      <span className="font-medium text-sm">{jt.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {formatCurrency(Number(jt.default_base_salary))}/ngày
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => { setEditingId(jt.id); setAddingNew(false) }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setDeleteId(jt.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete job type confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Xóa loại công việc này? Không thể xóa nếu đang được dùng trong nhật ký làm việc.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={deleteJobType.isPending}
              onClick={async () => {
                if (deleteId) {
                  await deleteJobType.mutateAsync(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              {deleteJobType.isPending ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
