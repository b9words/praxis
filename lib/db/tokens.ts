/**
 * Tokens repository
 * All token usage tracking operations go through here
 */

import { dbCall } from './utils'
import type { Prisma } from '@prisma/client'

export interface TrackTokenUsageData {
  date: Date
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface TokenUsageFilters {
  date?: Date
  model?: string
}

/**
 * Track token usage
 */
export async function trackTokenUsage(data: TrackTokenUsageData) {
  return dbCall(async (prisma) => {
    return prisma.tokenUsage.create({
      data: {
        date: data.date,
        model: data.model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
      },
    })
  })
}

/**
 * List token usage records
 */
export async function listTokenUsage(filters: TokenUsageFilters = {}) {
  const where: Prisma.TokenUsageWhereInput = {}

  if (filters.date) {
    where.date = filters.date
  }

  if (filters.model) {
    where.model = filters.model
  }

  return dbCall(async (prisma) => {
    return prisma.tokenUsage.findMany({
      where,
      select: {
        model: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  })
}

/**
 * Get aggregated token usage by model for a date
 */
export interface ModelUsage {
  model: string
  total_tokens: number
  prompt_tokens: number
  completion_tokens: number
}

export async function getAggregatedUsageByDate(date: Date): Promise<ModelUsage[]> {
  return dbCall(async (prisma) => {
    const usageRecords = await prisma.tokenUsage.findMany({
      where: {
        date,
      },
      select: {
        model: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
    })

    // Group by model and sum tokens
    const modelUsage = usageRecords.reduce(
      (acc, usage) => {
        if (!acc[usage.model]) {
          acc[usage.model] = {
            model: usage.model,
            total_tokens: 0,
            prompt_tokens: 0,
            completion_tokens: 0,
          }
        }
        acc[usage.model].total_tokens += usage.totalTokens
        acc[usage.model].prompt_tokens += usage.promptTokens
        acc[usage.model].completion_tokens += usage.completionTokens
        return acc
      },
      {} as Record<string, ModelUsage>
    )

    return Object.values(modelUsage)
  })
}

