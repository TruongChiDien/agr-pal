import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { listPayrolls, createPayroll, deletePayroll, getPayroll } from '@/actions/payroll'

export function usePayrolls() {
  return useQuery({
    queryKey: ['payrolls'],
    queryFn: listPayrolls,
  })
}

export function usePayroll(id: string) {
  return useQuery({
    queryKey: ['payrolls', id],
    queryFn: () => getPayroll(id),
    enabled: !!id,
  })
}

export function useCreatePayroll() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createPayroll,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['payrolls'] })
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        toast({
          title: 'Thành công',
          description: 'Phiếu lương đã được tạo',
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

export function useDeletePayroll() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deletePayroll,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['payrolls'] })
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        toast({
          title: 'Thành công',
          description: 'Phiếu lương đã được xóa',
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
