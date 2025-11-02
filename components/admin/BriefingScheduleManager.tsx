'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { createBriefingSchedule, updateBriefingSchedule, deleteBriefingSchedule, type BriefingScheduleInput } from '@/app/(app)/admin/briefing/actions'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { getModuleById, getDomainById } from '@/lib/curriculum-data'

interface BriefingSchedule {
  id: string
  weekOf: string
  domainId: string
  moduleId: string
  caseId: string
}

interface BriefingScheduleManagerProps {
  schedules: BriefingSchedule[]
  domains: Array<{ id: string; title: string }>
  cases: Array<{ id: string; title: string; status: string }>
}

export default function BriefingScheduleManager({
  schedules,
  domains,
  cases,
}: BriefingScheduleManagerProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<BriefingSchedule | null>(null)
  const [formData, setFormData] = useState<BriefingScheduleInput>({
    weekOf: '',
    domainId: '',
    moduleId: '',
    caseId: '',
  })
  const [selectedDomainId, setSelectedDomainId] = useState<string>('')

  // Get available modules for selected domain
  const selectedDomainData = selectedDomainId ? getDomainById(selectedDomainId) : null
  const modules = selectedDomainData
    ? selectedDomainData.modules.map((m) => ({
        id: m.id,
        title: m.title,
      }))
    : []

  const handleOpenDialog = (schedule?: BriefingSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule)
      setFormData({
        weekOf: schedule.weekOf,
        domainId: schedule.domainId,
        moduleId: schedule.moduleId,
        caseId: schedule.caseId,
      })
      setSelectedDomainId(schedule.domainId)
    } else {
      setEditingSchedule(null)
      setFormData({
        weekOf: '',
        domainId: '',
        moduleId: '',
        caseId: '',
      })
      setSelectedDomainId('')
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingSchedule(null)
    setFormData({
      weekOf: '',
      domainId: '',
      moduleId: '',
      caseId: '',
    })
    setSelectedDomainId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingSchedule) {
        await updateBriefingSchedule(editingSchedule.id, formData)
        toast.success('Briefing schedule updated successfully')
      } else {
        await createBriefingSchedule(formData)
        toast.success('Briefing schedule created successfully')
      }
      handleCloseDialog()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save schedule')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule entry?')) {
      return
    }

    try {
      await deleteBriefingSchedule(id)
      toast.success('Briefing schedule deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete schedule')
    }
  }

  const getModuleTitle = (domainId: string, moduleId: string) => {
    const module = getModuleById(domainId, moduleId)
    return module?.title || moduleId
  }

  const getDomainTitle = (domainId: string) => {
    return domains.find((d) => d.id === domainId)?.title || domainId
  }

  const getCaseTitle = (caseId: string) => {
    return cases.find((c) => c.id === caseId)?.title || caseId
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => handleOpenDialog()} className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule Entry
        </Button>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Briefings</CardTitle>
          <CardDescription>Upcoming and past weekly briefing schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-600 py-8 text-center">No briefing schedules found. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Week Of</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Domain</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Module</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Case Study</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => {
                    const weekDate = new Date(schedule.weekOf)
                    const isPast = weekDate < new Date()
                    const isCurrentWeek =
                      weekDate <= new Date() &&
                      weekDate.getTime() + 7 * 24 * 60 * 60 * 1000 >= new Date().getTime()

                    return (
                      <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{schedule.weekOf}</span>
                            {isCurrentWeek && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Current</span>
                            )}
                            {isPast && !isCurrentWeek && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Past</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{getDomainTitle(schedule.domainId)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{getModuleTitle(schedule.domainId, schedule.moduleId)}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{getCaseTitle(schedule.caseId)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(schedule)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(schedule.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Briefing Schedule' : 'Create Briefing Schedule'}</DialogTitle>
            <DialogDescription>
              Set the module and case study that will be publicly accessible for this week.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="weekOf">Week Of (Monday)</Label>
                <Input
                  id="weekOf"
                  type="date"
                  value={formData.weekOf}
                  onChange={(e) => setFormData({ ...formData, weekOf: e.target.value })}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Select the Monday of the week this briefing should be active</p>
              </div>

              <div>
                <Label htmlFor="domainId">Domain</Label>
                <Select
                  value={formData.domainId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, domainId: value, moduleId: '' })
                    setSelectedDomainId(value)
                  }}
                  required
                >
                  <SelectTrigger id="domainId" className="mt-1">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="moduleId">Module</Label>
                <Select
                  value={formData.moduleId}
                  onValueChange={(value) => setFormData({ ...formData, moduleId: value })}
                  required
                  disabled={!formData.domainId}
                >
                  <SelectTrigger id="moduleId" className="mt-1">
                    <SelectValue placeholder={formData.domainId ? 'Select a module' : 'Select domain first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="caseId">Case Study</Label>
                <Select
                  value={formData.caseId}
                  onValueChange={(value) => setFormData({ ...formData, caseId: value })}
                  required
                >
                  <SelectTrigger id="caseId" className="mt-1">
                    <SelectValue placeholder="Select a case study" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((caseItem) => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title} {caseItem.status !== 'published' && `(${caseItem.status})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white">
                {editingSchedule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

