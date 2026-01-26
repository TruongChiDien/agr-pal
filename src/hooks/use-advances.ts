import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { listAdvancePayments } from '@/actions/advances'
import { createAdvancePayment, deleteAdvancePayment, updateAdvancePayment } from '@/actions/workers'

export function useAdvancePayments(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['advances'],
    queryFn: listAdvancePayments,
    enabled: options?.enabled,
  })
}

// Re-export mutations for convenience, or implement shared mutations here
export function useCreateAdvancePayment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createAdvancePayment,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['workers'] }) // For worker detailed view
        queryClient.invalidateQueries({ queryKey: ['advances'] }) // For global list
        queryClient.invalidateQueries({ queryKey: ['payrolls'] })
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

export function useUpdateAdvancePayment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateAdvancePayment(id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['workers'] })
        queryClient.invalidateQueries({ queryKey: ['advances'] })
        queryClient.invalidateQueries({ queryKey: ['payrolls'] })
        toast({
          title: 'Thành công',
          description: 'Tạm ứng đã được cập nhật',
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
        queryClient.invalidateQueries({ queryKey: ['advances'] })
        queryClient.invalidateQueries({ queryKey: ['payrolls'] })
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
