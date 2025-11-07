'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { toast } from 'sonner'
import { Mail, Plus, Edit, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface AutomatedEmail {
  id: string
  eventName: string
  subject: string
  template: string
  delayDays: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AutomatedEmailForm {
  eventName: string
  subject: string
  template: string
  delayDays: number
  isActive: boolean
}

const VALID_EVENT_NAMES = [
  { value: 'user_signed_up', label: 'User Signed Up' },
  { value: 'domain_completed', label: 'Domain Completed' },
  { value: 'user_inactive', label: 'User Inactive' },
]

const VALID_TEMPLATES = [
  { value: 'welcome', label: 'Welcome Email' },
  { value: 'simulation_complete', label: 'Simulation Complete' },
  { value: 'weekly_summary', label: 'Weekly Summary' },
  { value: 'general', label: 'General Notification' },
  { value: 'subscription_confirmation', label: 'Subscription Confirmation' },
]

export default function AutomatedEmailManager() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmail, setEditingEmail] = useState<AutomatedEmail | null>(null)
  const [form, setForm] = useState<AutomatedEmailForm>({
    eventName: '',
    subject: '',
    template: '',
    delayDays: 0,
    isActive: true,
  })

  const { data: emails, isLoading } = useQuery<{ emails: AutomatedEmail[] }>({
    queryKey: ['automated-emails'],
    queryFn: () => fetchJson('/api/admin/automated-emails'),
  })

  const createMutation = useMutation({
    mutationFn: async (data: AutomatedEmailForm) => {
      return fetchJson('/api/admin/automated-emails', {
        method: 'POST',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-emails'] })
      toast.success('Automated email created successfully')
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create automated email')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AutomatedEmailForm> }) => {
      return fetchJson(`/api/admin/automated-emails/${id}`, {
        method: 'PUT',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-emails'] })
      toast.success('Automated email updated successfully')
      setIsDialogOpen(false)
      setEditingEmail(null)
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update automated email')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson(`/api/admin/automated-emails/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-emails'] })
      toast.success('Automated email deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete automated email')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return fetchJson(`/api/admin/automated-emails/${id}`, {
        method: 'PUT',
        body: { isActive },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-emails'] })
      toast.success('Automated email status updated')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    },
  })

  const resetForm = () => {
    setForm({
      eventName: '',
      subject: '',
      template: '',
      delayDays: 0,
      isActive: true,
    })
  }

  const handleCreate = () => {
    setEditingEmail(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (email: AutomatedEmail) => {
    setEditingEmail(email)
    setForm({
      eventName: email.eventName,
      subject: email.subject,
      template: email.template,
      delayDays: email.delayDays,
      isActive: email.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this automated email?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEmail) {
      updateMutation.mutate({ id: editingEmail.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleToggleActive = (id: string, currentActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentActive })
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Automated Email Management</h1>
          <p className="text-sm text-gray-600">Configure event-driven email triggers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
              <Plus className="mr-2 h-4 w-4" />
              Create Email Trigger
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEmail ? 'Edit Automated Email' : 'Create Automated Email'}</DialogTitle>
              <DialogDescription>
                Configure an automated email trigger that will be sent when a specific event occurs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name *</Label>
                <Select
                  value={form.eventName}
                  onValueChange={(value) => setForm({ ...form, eventName: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_EVENT_NAMES.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Welcome to Execemy"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Email Template *</Label>
                <Select
                  value={form.template}
                  onValueChange={(value) => setForm({ ...form, template: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {VALID_TEMPLATES.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delayDays">Delay (Days) *</Label>
                <Input
                  id="delayDays"
                  type="number"
                  min="0"
                  value={form.delayDays}
                  onChange={(e) => setForm({ ...form, delayDays: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500">
                  Number of days to wait before sending. Use 0 for immediate sends.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    resetForm()
                    setEditingEmail(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-none"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingEmail ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Automated Email Triggers
          </CardTitle>
          <CardDescription>
            Manage email triggers that are automatically sent based on user events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !emails?.emails || emails.emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No automated emails configured yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first email trigger to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Event</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Template</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Delay</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {emails.emails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Badge variant="outline">{email.eventName}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{email.subject}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{email.template}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {email.delayDays === 0 ? 'Immediate' : `${email.delayDays} day${email.delayDays !== 1 ? 's' : ''}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={email.isActive}
                            onCheckedChange={() => handleToggleActive(email.id, email.isActive)}
                            disabled={toggleActiveMutation.isPending}
                          />
                          {email.isActive ? (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-700 border-gray-300">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(email)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(email.id)}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}


