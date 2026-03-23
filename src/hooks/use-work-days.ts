import { useQuery } from '@tanstack/react-query'
import { listWorkDays } from '@/actions/work-days'

export function useWorkDays() {
  return useQuery({
    queryKey: ['work-days'],
    queryFn: listWorkDays,
    staleTime: 30 * 1000,
  })
}
