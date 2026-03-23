import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { listServices, createService, updateService, deleteService } from '@/actions/services'

export function useServices() {
  return useQuery({ queryKey: ['services'], queryFn: listServices, staleTime: 60_000 })
}

export function useCreateService() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: createService,
    onSuccess: (r) => {
      if (r.success) {
        qc.invalidateQueries({ queryKey: ['services'] })
        toast({ title: 'Đã tạo dịch vụ' })
      } else {
        toast({ title: 'Lỗi', description: r.error, variant: 'destructive' })
      }
    },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateService(id, data),
    onSuccess: (r) => {
      if (r.success) {
        qc.invalidateQueries({ queryKey: ['services'] })
        toast({ title: 'Đã cập nhật dịch vụ' })
      } else {
        toast({ title: 'Lỗi', description: r.error, variant: 'destructive' })
      }
    },
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: deleteService,
    onSuccess: (r) => {
      if (r.success) {
        qc.invalidateQueries({ queryKey: ['services'] })
      } else {
        toast({ title: 'Lỗi', description: r.error, variant: 'destructive' })
      }
    },
  })
}
