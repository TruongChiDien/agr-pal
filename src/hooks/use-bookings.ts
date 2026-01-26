import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { listBookings, createBooking, updateBooking, deleteBooking, getBooking, checkBookingIncompleteJobs, updateBookingWithJobs } from '@/actions/bookings'

export function useBookings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: listBookings,
    staleTime: 60 * 1000,
    enabled: options?.enabled,
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => getBooking(id),
    enabled: !!id,
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createBooking,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        toast({
          title: 'Thành công',
          description: 'Booking đã được tạo',
        })
      } else {
        toast({
          title: 'Lỗi',
          description: result.error,
          variant: 'destructive',
        })
      }
    },
    onError: () => {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi tạo booking',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateBooking(id, data),
    onSuccess: (result, { id }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        queryClient.invalidateQueries({ queryKey: ['bookings', id] })
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        toast({
          title: 'Thành công',
          description: 'Booking đã được cập nhật',
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

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        toast({
          title: 'Thành công',
          description: 'Booking đã được xóa',
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

export function useCheckBookingIncompleteJobs(id: string) {
  return useQuery({
    queryKey: ['bookings', id, 'incomplete-jobs'],
    queryFn: () => checkBookingIncompleteJobs(id),
    enabled: false, // Manual query
  })
}

export function useUpdateBookingWithJobs() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data, completeJobs }: { id: string; data: unknown; completeJobs: boolean }) =>
      updateBookingWithJobs(id, data, completeJobs),
    onSuccess: (result, { id }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] })
        queryClient.invalidateQueries({ queryKey: ['bookings', id] })
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['customers'] })
        toast({
          title: 'Thành công',
          description: 'Booking đã được cập nhật',
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
