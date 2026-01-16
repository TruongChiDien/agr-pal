import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { listMachines, createMachine, updateMachine, deleteMachine, getMachine } from '@/actions/machines'

export function useMachines() {
  return useQuery({
    queryKey: ['machines'],
    queryFn: listMachines,
  })
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: ['machines', id],
    queryFn: () => getMachine(id),
    enabled: !!id,
  })
}

export function useCreateMachine() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createMachine,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['machines'] })
        toast({
          title: 'Thành công',
          description: 'Máy đã được tạo',
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

export function useUpdateMachine() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateMachine(id, data),
    onSuccess: (result, { id }) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['machines'] })
        queryClient.invalidateQueries({ queryKey: ['machines', id] })
        toast({
          title: 'Thành công',
          description: 'Máy đã được cập nhật',
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

export function useDeleteMachine() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteMachine,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['machines'] })
        toast({
          title: 'Thành công',
          description: 'Máy đã được xóa',
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
