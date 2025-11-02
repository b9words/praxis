'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Eye, RotateCcw, Trash2 } from 'lucide-react'
import { fetchJson } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'

interface Simulation {
  id: string
  status: string
  startedAt: Date
  completedAt: Date | null
  user: {
    id: string
    username: string
    fullName: string | null
  }
  case: {
    id: string
    title: string
  }
  debrief?: {
    id: string
    scores: any
    summaryText: string
  } | null
}

interface SimulationsManagementProps {
  initialSimulations: Simulation[]
  totalSimulations: number
  currentPage: number
  perPage: number
  users: Array<{ id: string; username: string; fullName: string | null }>
  cases: Array<{ id: string; title: string }>
  initialFilters: {
    userId: string
    caseId: string
    status: string
  }
}

export default function SimulationsManagement({
  initialSimulations,
  totalSimulations,
  currentPage,
  perPage,
  users,
  cases,
  initialFilters,
}: SimulationsManagementProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState(initialFilters.userId)
  const [caseId, setCaseId] = useState(initialFilters.caseId)
  const [status, setStatus] = useState(initialFilters.status)
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)

  const regenerateMutation = useMutation({
    mutationFn: async (simulationId: string) => {
      return fetchJson(`/api/generate-debrief?simulationId=${simulationId}`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      toast.success('Debrief regenerated successfully')
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate debrief')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson(`/api/simulations/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      toast.success('Simulation deleted successfully')
      router.refresh()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete simulation')
    },
  })

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (userId && userId !== '__all__') params.set('userId', userId)
    if (caseId && caseId !== '__all__') params.set('caseId', caseId)
    if (status && status !== '__all__') params.set('status', status)
    router.push(`/admin/simulations?${params.toString()}`)
  }

  const handleRegenerate = (id: string) => {
    if (confirm('Are you sure you want to regenerate the debrief for this simulation? This will overwrite the existing debrief.')) {
      regenerateMutation.mutate(id)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this simulation? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const totalPages = Math.ceil(totalSimulations / perPage)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      in_progress: 'secondary',
      abandoned: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Simulations & Debriefs</h1>
          <p className="text-sm text-gray-600">View and manage user simulations and debriefs</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">User</label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Case</label>
              <Select value={caseId} onValueChange={setCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="All cases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All cases</SelectItem>
                  {cases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Simulations ({totalSimulations})</CardTitle>
          <CardDescription>
            Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalSimulations)} of {totalSimulations}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Debrief</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {initialSimulations.map((sim) => (
                  <tr key={sim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sim.user.username}</div>
                      {sim.user.fullName && (
                        <div className="text-sm text-gray-500">{sim.user.fullName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sim.case.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sim.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sim.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sim.completedAt ? new Date(sim.completedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sim.debrief ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Generated
                        </Badge>
                      ) : sim.status === 'completed' ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          Pending
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/admin/simulations/${sim.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {sim.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerate(sim.id)}
                            disabled={regenerateMutation.isPending}
                            title="Regenerate Debrief"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sim.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (userId) params.set('userId', userId)
                    if (caseId) params.set('caseId', caseId)
                    if (status) params.set('status', status)
                    params.set('page', String(currentPage - 1))
                    router.push(`/admin/simulations?${params.toString()}`)
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    const params = new URLSearchParams()
                    if (userId) params.set('userId', userId)
                    if (caseId) params.set('caseId', caseId)
                    if (status) params.set('status', status)
                    params.set('page', String(currentPage + 1))
                    router.push(`/admin/simulations?${params.toString()}`)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

