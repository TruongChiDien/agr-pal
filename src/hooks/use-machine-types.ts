import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  listMachineTypes,
  createMachineType,
  updateMachineType,
  deleteMachineType,
  createJobType,
  updateJobType,
  deleteJobType,
} from '@/actions/machine-types'

export function useMachineTypes() {
  return useQuery({
    queryKey: ['machine-types'],
    queryFn: listMachineTypes,
    staleTime: 60 * 1000,
  })
}

export function useCreateMachineType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createMachineType,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['machine-types'] })
        toast({ title: 'Thành công', description: 'Đã tạo loại máy' })
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
      }
    },
  })
}

export function useUpdateMachineType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateMachineType(id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['machine-types'] })
        toast({ title: 'Thành công', description: 'Đã cập nhật loại máy' })
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
      }
    },
  })
}

export function useDeleteMachineType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: deleteMachineType,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['machine-types'] })
        toast({ title: 'Thành công', description: 'Đã xóa loại máy' })
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
      }
    },
  })
}

// Job types are now owned by machine_type — no standalone useJobTypes()
// Job type data comes embedded in useMachineTypes()

export function useCreateJobType() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ machine_type_id, data }: { machine_type_id: string; data: unknown }) =>
      createJobType(machine_type_id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['machine-types'] })
        toast({ title: 'Thành công', description: 'Đã tạo loại công việc' })
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
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
        queryClient.invalidateQueries({ queryKey: ['machine-types'] })
        toast({ title: 'Thành công', description: 'Đã cập nhật loại công việc' })
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
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
        queryClient.invalidateQueries({ queryKey: ['machine-types'] })
        toast({ title: 'Thành công', description: 'Đã xóa loại công việc' })
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
      }
    },
  })
}
