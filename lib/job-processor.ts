import { prisma } from './prisma/server'

export type JobType = 'debrief_generation' | 'thumbnail_generation' | string
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  payload: Record<string, any>
  result?: Record<string, any> | null
  error?: string | null
  createdAt: Date
  updatedAt: Date
  processedAt?: Date | null
}

/**
 * Create a new background job
 */
export async function createJob(
  type: JobType,
  payload: Record<string, any>
): Promise<Job> {
  const job = await prisma.job.create({
    data: {
      type,
      status: 'pending',
      payload,
    },
  })

  return {
    id: job.id,
    type: job.type,
    status: job.status as JobStatus,
    payload: job.payload as Record<string, any>,
    result: job.result as Record<string, any> | null,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    processedAt: job.processedAt,
  }
}

/**
 * Get a job by ID
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  })

  if (!job) return null

  return {
    id: job.id,
    type: job.type,
    status: job.status as JobStatus,
    payload: job.payload as Record<string, any>,
    result: job.result as Record<string, any> | null,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    processedAt: job.processedAt,
  }
}

/**
 * Update job status and result
 */
export async function updateJob(
  jobId: string,
  updates: {
    status?: JobStatus
    result?: Record<string, any>
    error?: string
  }
): Promise<Job> {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: {
      ...(updates.status && { status: updates.status }),
      ...(updates.result !== undefined && { result: updates.result }),
      ...(updates.error !== undefined && { error: updates.error }),
      ...(updates.status === 'completed' || updates.status === 'failed'
        ? { processedAt: new Date() }
        : {}),
    },
  })

  return {
    id: job.id,
    type: job.type,
    status: job.status as JobStatus,
    payload: job.payload as Record<string, any>,
    result: job.result as Record<string, any> | null,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    processedAt: job.processedAt,
  }
}

/**
 * Get pending jobs for processing
 */
export async function getPendingJobs(
  type?: JobType,
  limit: number = 10
): Promise<Job[]> {
  const jobs = await prisma.job.findMany({
    where: {
      status: 'pending',
      ...(type && { type }),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  return jobs.map(job => ({
    id: job.id,
    type: job.type,
    status: job.status as JobStatus,
    payload: job.payload as Record<string, any>,
    result: job.result as Record<string, any> | null,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    processedAt: job.processedAt,
  }))
}

