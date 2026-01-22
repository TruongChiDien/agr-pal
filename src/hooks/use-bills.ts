import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { listBills, createBill, deleteBill, getBill, addBillPayment } from '@/actions/bills'

export function useBills() {
  return useQuery({
    queryKey: ['bills'],
    queryFn: listBills,
  })
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ['bills', id],
    queryFn: () => getBill(id),
    enabled: !!id,
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createBill,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bills'] })
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        toast({
          title: 'Thành công',
          description: 'Hóa đơn đã được tạo',
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

export function useDeleteBill() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteBill,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bills'] })
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        toast({
          title: 'Thành công',
          description: 'Hóa đơn đã được xóa',
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

export function useAddBillPayment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: addBillPayment,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bills'] })
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        toast({
          title: 'Thành công',
          description: 'Đã thêm thanh toán',
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
