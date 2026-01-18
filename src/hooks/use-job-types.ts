import { useQuery } from '@tanstack/react-query'
import { listJobTypes } from '@/actions/job-types'

export function useJobTypes() {
  return useQuery({
    queryKey: ['job-types'],
    queryFn: listJobTypes,
  })
}
