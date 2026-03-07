import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  getMaintenanceCategories,
  getMaintenanceLogs,
  createMaintenanceLog,
  deleteMaintenanceLog,
} from '@/actions/machine-logs'
import { CreateMaintenanceLogInput } from '@/schemas/machine-logs'

export function useMaintenanceCategories() {
  return useQuery({
    queryKey: ['maintenanceCategories'],
    queryFn: async () => {
      const result = await getMaintenanceCategories()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}

export function useMaintenanceLogs(machineId: string) {
  return useQuery({
    queryKey: ['maintenanceLogs', machineId],
    queryFn: async () => {
      const result = await getMaintenanceLogs(machineId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!machineId,
  })
}

export function useCreateMaintenanceLog(machineId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateMaintenanceLogInput) => createMaintenanceLog(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['maintenanceLogs', machineId] })
        queryClient.invalidateQueries({ queryKey: ['maintenanceCategories'] })
        toast({
          title: 'Thành công',
          description: 'Lịch sử bảo trì đã được thêm',
        })
      } else {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        })
      }
    },
  })
}

export function useDeleteMaintenanceLog(machineId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteMaintenanceLog,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['maintenanceLogs', machineId] })
        toast({
          title: 'Thành công',
          description: 'Lịch sử bảo trì đã được xóa',
        })
      } else {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        })
      }
    },
  })
}
