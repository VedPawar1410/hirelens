export const jobsQueryKeys = {
  all: () => ['jobs'] as const,
  list: (page: number) => ['jobs', page] as const,
  detail: (jobId: string) => ['jobs', jobId] as const,
}
