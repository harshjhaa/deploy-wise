import { useQuery } from '@tanstack/react-query'
import { fetchFoundationResources } from './foundation.api'

export function useFoundationResources() {
  return useQuery({
    queryKey: ['foundation-resources'],
    queryFn: fetchFoundationResources,
    retry: 1,
  })
}
