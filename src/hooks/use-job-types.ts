import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { listJobTypes, createJobType, updateJobType, deleteJobType } from '@/actions/job-types'

export function useJobTypes() {
  return useQuery({
    queryKey: ['job-types'],
    queryFn: listJobTypes,
  })
}

export function useCreateJobType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createJobType,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['services'] })
        queryClient.invalidateQueries({ queryKey: ['job-types'] })
        toast({
          title: 'Thành công',
          description: 'Loại công việc đã được tạo',
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

export function useUpdateJobType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateJobType(id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['services'] })
        queryClient.invalidateQueries({ queryKey: ['job-types'] })
        toast({
          title: 'Thành công',
          description: 'Loại công việc đã được cập nhật',
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

export function useDeleteJobType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteJobType,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['services'] })
        queryClient.invalidateQueries({ queryKey: ['job-types'] })
        toast({
          title: 'Thành công',
          description: 'Loại công việc đã được xóa',
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
