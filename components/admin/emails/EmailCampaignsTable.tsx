'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { toast } from 'sonner'
import { Mail, Edit, Trash2, Loader2, CheckCircle2, XCircle, Send, Calendar } from 'lucide-react'
import { format } from 'date-fns'

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

interface EmailCampaignsTableProps {
  campaigns: EmailCampaign[]
  isLoading: boolean
  onEdit: (campaign: EmailCampaign) => void
  onDelete: (id: string) => void
  onSendNewsletter?: (id: string) => void
  isSending?: boolean
}

export default function EmailCampaignsTable({
  campaigns,
  isLoading,
  onEdit,
  onDelete,
  onSendNewsletter,
  isSending = false,
}: EmailCampaignsTableProps) {
  const queryClient = useQueryClient()

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return fetchJson(`/api/admin/emails/${id}`, {
        method: 'PUT',
        body: { isActive },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      toast.success('Email campaign status updated')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    },
  })

  const handleToggleActive = (id: string, currentActive: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentActive })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Campaigns
        </CardTitle>
        <CardDescription>
          {onSendNewsletter
            ? 'Manage newsletters that can be sent to all subscribers'
            : 'Manage automated email triggers based on user events'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No email campaigns configured yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first campaign to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {onSendNewsletter && <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Name</th>}
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Subject</th>
                  {!onSendNewsletter && <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Event</th>}
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Template</th>
                  {!onSendNewsletter && <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Delay</th>}
                  {onSendNewsletter && <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Summary</th>}
                  {onSendNewsletter && <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Published</th>}
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    {onSendNewsletter && (
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.name || 'Untitled Newsletter'}
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900">{campaign.subject}</div>
                    </td>
                    {!onSendNewsletter && (
                      <td className="py-3 px-4">
                        <Badge variant="outline">{campaign.eventName}</Badge>
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-gray-600">{campaign.template}</td>
                    {!onSendNewsletter && (
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {campaign.delayDays === 0
                          ? 'Immediate'
                          : `${campaign.delayDays} day${campaign.delayDays !== 1 ? 's' : ''}`}
                      </td>
                    )}
                    {onSendNewsletter && (
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {campaign.summary || 'No summary'}
                        </div>
                      </td>
                    )}
                    {onSendNewsletter && (
                      <td className="py-3 px-4">
                        {campaign.publishedAt ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(campaign.publishedAt), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not published</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={campaign.isActive}
                          onCheckedChange={() => handleToggleActive(campaign.id, campaign.isActive)}
                          disabled={toggleActiveMutation.isPending}
                        />
                        {campaign.isActive ? (
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
                        {onSendNewsletter && !campaign.publishedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSendNewsletter?.(campaign.id)}
                            disabled={isSending}
                            className="h-8 px-3 text-blue-600 hover:text-blue-700"
                          >
                            {isSending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(campaign)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(campaign.id)}
                          disabled={toggleActiveMutation.isPending}
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
  )
}


