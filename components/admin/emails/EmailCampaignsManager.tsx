'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { toast } from 'sonner'
import { Mail, Plus, Edit, Trash2, Loader2, CheckCircle2, XCircle, Send } from 'lucide-react'
import EmailCampaignsTable from './EmailCampaignsTable'
import EditEmailCampaignForm from './EditEmailCampaignForm'

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

export default function EmailCampaignsManager() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null)
  const [activeTab, setActiveTab] = useState<'drip' | 'newsletter'>('drip')

  const { data, isLoading } = useQuery<{ emails: EmailCampaign[] }>({
    queryKey: ['email-campaigns'],
    queryFn: () => fetchJson('/api/admin/emails'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return fetchJson(`/api/admin/emails/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast.success('Email campaign deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete email campaign')
    },
  })

  const sendNewsletterMutation = useMutation({
    mutationFn: async (newsletterId: string) => {
      return fetchJson('/api/admin/emails/send-newsletter', {
        method: 'POST',
        body: { newsletterId },
      })
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast.success(`Newsletter sent successfully! Sent to ${data.sent} recipients.`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send newsletter')
    },
  })

  const handleCreate = (type: 'DRIP' | 'NEWSLETTER') => {
    setEditingCampaign(null)
    setIsDialogOpen(true)
    setActiveTab(type === 'NEWSLETTER' ? 'newsletter' : 'drip')
  }

  const handleEdit = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign)
    setIsDialogOpen(true)
    setActiveTab(campaign.type === 'NEWSLETTER' ? 'newsletter' : 'drip')
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this email campaign?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSendNewsletter = (id: string) => {
    if (confirm('Are you sure you want to send this newsletter to all subscribers?')) {
      sendNewsletterMutation.mutate(id)
    }
  }

  const dripCampaigns = data?.emails.filter(e => (e.type || 'DRIP') === 'DRIP') || []
  const newsletters = data?.emails.filter(e => e.type === 'NEWSLETTER') || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Email Campaigns</h2>
          <p className="text-sm text-gray-600">Manage automated drip campaigns and newsletters</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleCreate('DRIP')} className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
            <Plus className="mr-2 h-4 w-4" />
            New Drip Campaign
          </Button>
          <Button onClick={() => handleCreate('NEWSLETTER')} variant="outline" className="rounded-none">
            <Plus className="mr-2 h-4 w-4" />
            New Newsletter
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCampaign ? 'Edit Email Campaign' : 'Create Email Campaign'}
                </DialogTitle>
                <DialogDescription>
                  {editingCampaign?.type === 'NEWSLETTER' || activeTab === 'newsletter'
                    ? 'Create or edit a newsletter that can be sent to all subscribers'
                    : 'Configure an automated email trigger that will be sent when a specific event occurs'}
                </DialogDescription>
              </DialogHeader>
              <EditEmailCampaignForm
                campaign={editingCampaign}
                initialType={activeTab === 'newsletter' ? 'NEWSLETTER' : 'DRIP'}
                onSuccess={() => {
                  setIsDialogOpen(false)
                  setEditingCampaign(null)
                }}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingCampaign(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="drip" className="space-y-4">
        <TabsList>
          <TabsTrigger value="drip">Drip Campaigns ({dripCampaigns.length})</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletters ({newsletters.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="drip">
          <EmailCampaignsTable
            campaigns={dripCampaigns}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSendNewsletter={undefined}
          />
        </TabsContent>

        <TabsContent value="newsletter">
          <EmailCampaignsTable
            campaigns={newsletters}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSendNewsletter={handleSendNewsletter}
            isSending={sendNewsletterMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

