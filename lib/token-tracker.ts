import { OPENAI_TOKEN_LIMITS } from './content-generator'
import { prisma } from './prisma/server'

export interface TokenUsage {
  id?: string
  date: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  created_at?: string
}

export interface DailyUsageSummary {
  date: string
  model: string
  total_tokens: number
  limit: number
  remaining: number
  percentage_used: number
}

export class TokenTracker {
  async trackUsage(usage: Omit<TokenUsage, 'id' | 'created_at'>): Promise<void> {
    try {
      await prisma.tokenUsage.create({
        data: {
          date: new Date(usage.date),
          model: usage.model,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      })
    } catch (error) {
      console.error('Failed to track token usage:', error)
    }
  }

  async getDailyUsage(date: string, model?: string): Promise<DailyUsageSummary[]> {
    try {
      const dateObj = new Date(date)

      const where: any = {
        date: dateObj,
      }

      if (model) {
        where.model = model
      }

      const usageRecords = await prisma.tokenUsage.findMany({
        where,
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
        {} as Record<
          string,
          { total_tokens: number; prompt_tokens: number; completion_tokens: number }
        >
      )

      // Convert to summary format
      return Object.entries(modelUsage).map(([modelName, usage]) => {
        const limit =
          OPENAI_TOKEN_LIMITS[modelName as keyof typeof OPENAI_TOKEN_LIMITS] || 0
        const remaining = Math.max(0, limit - usage.total_tokens)
        const percentage_used = limit > 0 ? (usage.total_tokens / limit) * 100 : 0

        return {
          date,
          model: modelName,
          total_tokens: usage.total_tokens,
          limit,
          remaining,
          percentage_used,
        }
      })
    } catch (error) {
      console.error('Failed to get daily usage:', error)
      return []
    }
  }

  async checkTokenLimit(model: string, estimatedTokens: number): Promise<{
    canProceed: boolean
    currentUsage: number
    limit: number
    remaining: number
    message: string
  }> {
    const today = new Date().toISOString().split('T')[0]
    const dailyUsage = await this.getDailyUsage(today, model)

    const modelUsage = dailyUsage.find((u) => u.model === model)
    const currentUsage = modelUsage?.total_tokens || 0
    const limit = OPENAI_TOKEN_LIMITS[model as keyof typeof OPENAI_TOKEN_LIMITS] || 0
    const remaining = limit - currentUsage

    const canProceed = remaining >= estimatedTokens

    let message = ''
    if (!canProceed) {
      message = `Token limit exceeded. Need ${estimatedTokens} tokens but only ${remaining} remaining for ${model} today.`
    } else if (remaining < estimatedTokens * 2) {
      message = `Warning: Low token balance. ${remaining} tokens remaining for ${model} today.`
    } else {
      message = `Token check passed. ${remaining} tokens remaining for ${model} today.`
    }

    return {
      canProceed,
      currentUsage,
      limit,
      remaining,
      message,
    }
  }

  async getAllDailyUsage(date: string): Promise<DailyUsageSummary[]> {
    return this.getDailyUsage(date)
  }

  async getUsageHistory(days: number = 7): Promise<DailyUsageSummary[]> {
    const results: DailyUsageSummary[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dailyUsage = await this.getDailyUsage(dateStr)
      results.push(...dailyUsage)
    }

    return results
  }

  // Estimate tokens for a prompt (rough approximation)
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    // Add buffer for completion tokens (usually 2-3x prompt tokens)
    const promptTokens = Math.ceil(text.length / 4)
    const estimatedCompletionTokens = promptTokens * 2.5 // Conservative estimate
    return Math.ceil(promptTokens + estimatedCompletionTokens)
  }
}
