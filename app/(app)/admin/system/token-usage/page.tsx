import { prisma } from '@/lib/prisma/server'
import { isMissingTable } from '@/lib/api/route-helpers'
import { redirect } from 'next/navigation'
import { cache, CacheTags } from '@/lib/cache'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminTokenUsagePage() {
  // Cache token usage (15 minutes revalidate)
  const getCachedTokenUsage = cache(
    async () => {
      // Wrap with error handling for missing tables (P2021)
      let tokenUsage: any[] = []
      try {
        tokenUsage = await (prisma as any).tokenUsage.findMany({
          orderBy: {
            date: 'desc',
          },
          take: 100,
        })
      } catch (error: any) {
        if (isMissingTable(error)) {
          tokenUsage = []
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('[admin/token-usage] Error fetching token usage:', error)
          }
          tokenUsage = []
        }
      }
      
      return tokenUsage
    },
    ['admin', 'system', 'token-usage'],
    {
      tags: [CacheTags.ADMIN, CacheTags.SYSTEM],
      revalidate: 900, // 15 minutes
    }
  )
  
  const tokenUsage = await getCachedTokenUsage()

  const totalUsage = tokenUsage.reduce(
    (acc, entry) => ({
      prompt: acc.prompt + entry.promptTokens,
      completion: acc.completion + entry.completionTokens,
      total: acc.total + entry.totalTokens,
    }),
    { prompt: 0, completion: 0, total: 0 }
  )

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">AI Token Usage</h1>
        <p className="text-sm text-gray-600">Monitor AI API token consumption</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Prompt Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.prompt.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Completion Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.completion.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.total.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Usage</CardTitle>
          <CardDescription>Token usage by date and model</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prompt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokenUsage.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.promptTokens.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.completionTokens.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.totalTokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

