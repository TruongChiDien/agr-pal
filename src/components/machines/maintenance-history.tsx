'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatDateShort } from '@/lib/format'
import { useMaintenanceLogs, useDeleteMaintenanceLog } from '@/hooks/use-machine-logs'
import { CreateMaintenanceDialog } from './create-maintenance-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MaintenanceHistoryProps {
  machineId: string
}

export function MaintenanceHistory({ machineId }: MaintenanceHistoryProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  const { data: logs, isLoading } = useMaintenanceLogs(machineId)
  const deleteLog = useDeleteMaintenanceLog(machineId)

  const handleDeleteConfirm = async () => {
    if (!selectedLogId) return
    await deleteLog.mutateAsync(selectedLogId, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSelectedLogId(null)
      },
    })
  }

  const handleDeleteClick = (id: string) => {
    setSelectedLogId(id)
    setDeleteDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Lịch sử bảo trì</CardTitle>
          <CardDescription>
            Danh sách thay nhớt và phụ tùng của máy
          </CardDescription>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm mới
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại phụ tùng</TableHead>
                  <TableHead>Hãng</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateShort(log.maintenance_date)}</TableCell>
                    <TableCell className="font-medium">{log.category.name}</TableCell>
                    <TableCell>{log.brand || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(log.price)}</TableCell>
                    <TableCell className="text-right">{log.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(log.price * log.quantity)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={log.notes || ''}>
                      {log.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(log.id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground">Chưa có dữ liệu bảo trì</p>
          </div>
        )}
      </CardContent>

      <CreateMaintenanceDialog
        machineId={machineId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa lịch sử bảo trì này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLog.isPending}
            >
              {deleteLog.isPending ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
