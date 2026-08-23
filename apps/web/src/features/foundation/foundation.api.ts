import { apiClient } from '../../lib/apiClient'

const foundationResources = [
  { label: 'Environments' as const, path: '/api/v1/environments' },
  { label: 'Games' as const, path: '/api/v1/games' },
  { label: 'Users' as const, path: '/api/v1/users' },
]

export async function fetchFoundationResources() {
  return Promise.all(
    foundationResources.map(async ({ label, path }) => ({
      label,
      count: (await apiClient.get<unknown[]>(path)).length,
    })),
  )
}
