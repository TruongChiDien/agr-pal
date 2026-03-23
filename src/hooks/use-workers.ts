import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  listWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorker,
  createAdvancePayment,
  deleteAdvancePayment
} from '@/actions/workers'

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: listWorkers,
  })
}

export function useWorker(id: string) {
  return useQuery({
    queryKey: ['workers', id],
    queryFn: () => getWorker(id),
    enabled: !!id,
  })
}

export function useCreateWorker() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createWorker,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['workers'] })
        toast({
          title: 'Thành công',
          description: 'Công nhân đã được tạo',
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

export function useUpdateWorker() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateWorker(id, data),
    onSuccess: (result, { id }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['workers'] })
        queryClient.invalidateQueries({ queryKey: ['workers', id] })
        toast({
          title: 'Thành công',
          description: 'Công nhân đã được cập nhật',
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

export function useDeleteWorker() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteWorker,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['workers'] })
        toast({
          title: 'Thành công',
          description: 'Công nhân đã được xóa',
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

// Advance Payment hooks
export function useCreateAdvancePayment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createAdvancePayment,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['workers'] })
        queryClient.invalidateQueries({ queryKey: ['payrolls'] })
        queryClient.invalidateQueries({ queryKey: ['advances'] })
        toast({
          title: 'Thành công',
          description: 'Tạm ứng đã được tạo',
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

export function useDeleteAdvancePayment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteAdvancePayment,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['workers'] })
        queryClient.invalidateQueries({ queryKey: ['payrolls'] })
        queryClient.invalidateQueries({ queryKey: ['advances'] })
        toast({
          title: 'Thành công',
          description: 'Tạm ứng đã được xóa',
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
