'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EmailCampaign {
  id: string
  eventName: string
  subject: string
  template: string
  delayDays: number
  isActive: boolean
  name?: string | null
  type: string
  summary?: string | null
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

interface EditEmailCampaignFormProps {
  campaign?: EmailCampaign | null
  initialType?: 'DRIP' | 'NEWSLETTER'
  onSuccess: () => void
  onCancel: () => void
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

export default function EditEmailCampaignForm({
  campaign,
  initialType = 'DRIP',
  onSuccess,
  onCancel,
}: EditEmailCampaignFormProps) {
  const queryClient = useQueryClient()
  const [type, setType] = useState<'DRIP' | 'NEWSLETTER'>(campaign?.type === 'NEWSLETTER' ? 'NEWSLETTER' : initialType)
  const [form, setForm] = useState({
    name: campaign?.name || '',
    eventName: campaign?.eventName || 'user_signed_up',
    subject: campaign?.subject || '',
    template: campaign?.template || 'general',
    delayDays: campaign?.delayDays || 0,
    isActive: campaign?.isActive ?? true,
    summary: campaign?.summary || '',
  })

  useEffect(() => {
    if (campaign) {
      setType(campaign.type === 'NEWSLETTER' ? 'NEWSLETTER' : 'DRIP')
      setForm({
        name: campaign.name || '',
        eventName: campaign.eventName || 'user_signed_up',
        subject: campaign.subject || '',
        template: campaign.template || 'general',
        delayDays: campaign.delayDays || 0,
        isActive: campaign.isActive ?? true,
        summary: campaign.summary || '',
      })
    }
  }, [campaign])

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return fetchJson('/api/admin/emails', {
        method: 'POST',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast.success('Email campaign created successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create email campaign')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJson(`/api/admin/emails/${id}`, {
        method: 'PUT',
        body: data,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast.success('Email campaign updated successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update email campaign')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submitData: any = {
      type,
      subject: form.subject,
      template: form.template,
      isActive: form.isActive,
    }

    if (type === 'NEWSLETTER') {
      submitData.eventName = 'newsletter'
      submitData.name = form.name
      submitData.summary = form.summary
      submitData.delayDays = 0
    } else {
      submitData.eventName = form.eventName
      submitData.delayDays = form.delayDays
    }

    if (campaign) {
      updateMutation.mutate({ id: campaign.id, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select value={type} onValueChange={(value) => setType(value as 'DRIP' | 'NEWSLETTER')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRIP">Drip Campaign</SelectItem>
            <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'NEWSLETTER' && (
        <div className="space-y-2">
          <Label htmlFor="name">Newsletter Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Weekly Newsletter #1"
            required
          />
        </div>
      )}

      {type === 'DRIP' && (
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
      )}

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

      {type === 'DRIP' && (
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
      )}

      {type === 'NEWSLETTER' && (
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="A brief summary of this newsletter for the archive..."
            rows={3}
          />
          <p className="text-xs text-gray-500">
            This summary will be displayed in the public newsletter archive.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Active</Label>
        <Switch
          id="isActive"
          checked={form.isActive}
          onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
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
          {campaign ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}


