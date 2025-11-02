'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useMutation } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { toast } from 'sonner'
import { Mail, Send, Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

type EmailTemplateType = 
  | 'welcome'
  | 'simulation_complete'
  | 'weekly_summary'
  | 'general'
  | 'subscription_confirmation'

interface SendEmailForm {
  template: EmailTemplateType
  recipients: 'all' | 'selected'
  selectedEmails: string
  // Welcome
  userName?: string
  loginUrl?: string
  // Simulation Complete
  caseTitle?: string
  debriefUrl?: string
  // Weekly Summary
  articlesCompleted?: number
  simulationsCompleted?: number
  lessonsCompleted?: number
  // General
  title?: string
  message?: string
  actionUrl?: string
  actionText?: string
  // Subscription
  planName?: string
}

export default function NotificationManager() {
  const [form, setForm] = useState<SendEmailForm>({
    template: 'general',
    recipients: 'all',
    selectedEmails: '',
  })

  const [lastResult, setLastResult] = useState<{
    success: boolean
    sent: number
    failed: number
    errors?: string[]
  } | null>(null)

  const sendMutation = useMutation({
    mutationFn: async (data: SendEmailForm) => {
      return fetchJson<{ success: boolean; sent: number; failed: number; errors?: string[] }>(
        '/api/admin/notifications/send',
        {
          method: 'POST',
          body: data,
        }
      )
    },
    onSuccess: (data) => {
      setLastResult(data)
      if (data.success) {
        toast.success(`Emails sent: ${data.sent} successful, ${data.failed} failed`)
      } else {
        toast.error('Failed to send emails')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send emails')
      setLastResult({
        success: false,
        sent: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMutation.mutate(form)
  }

  const templateFields = {
    welcome: (
      <>
        <div className="space-y-2">
          <Label htmlFor="userName">User Name (Optional)</Label>
          <Input
            id="userName"
            value={form.userName || ''}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loginUrl">Login URL (Optional)</Label>
          <Input
            id="loginUrl"
            value={form.loginUrl || ''}
            onChange={(e) => setForm({ ...form, loginUrl: e.target.value })}
            placeholder="https://execemy.com/dashboard"
          />
        </div>
      </>
    ),
    simulation_complete: (
      <>
        <div className="space-y-2">
          <Label htmlFor="caseTitle">Case Title *</Label>
          <Input
            id="caseTitle"
            value={form.caseTitle || ''}
            onChange={(e) => setForm({ ...form, caseTitle: e.target.value })}
            placeholder="Market Positioning Dilemma"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="debriefUrl">Debrief URL (Optional)</Label>
          <Input
            id="debriefUrl"
            value={form.debriefUrl || ''}
            onChange={(e) => setForm({ ...form, debriefUrl: e.target.value })}
            placeholder="https://execemy.com/debrief/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userName">User Name (Optional)</Label>
          <Input
            id="userName"
            value={form.userName || ''}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </>
    ),
    weekly_summary: (
      <>
        <div className="space-y-2">
          <Label htmlFor="userName">User Name (Optional)</Label>
          <Input
            id="userName"
            value={form.userName || ''}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="articlesCompleted">Articles Completed</Label>
            <Input
              id="articlesCompleted"
              type="number"
              value={form.articlesCompleted || ''}
              onChange={(e) => setForm({ ...form, articlesCompleted: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lessonsCompleted">Lessons Completed</Label>
            <Input
              id="lessonsCompleted"
              type="number"
              value={form.lessonsCompleted || ''}
              onChange={(e) => setForm({ ...form, lessonsCompleted: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simulationsCompleted">Simulations Completed</Label>
            <Input
              id="simulationsCompleted"
              type="number"
              value={form.simulationsCompleted || ''}
              onChange={(e) => setForm({ ...form, simulationsCompleted: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
            />
          </div>
        </div>
      </>
    ),
    general: (
      <>
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title || ''}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Important Update"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            value={form.message || ''}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Enter your notification message here..."
            rows={5}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actionUrl">Action URL (Optional)</Label>
          <Input
            id="actionUrl"
            value={form.actionUrl || ''}
            onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
            placeholder="https://execemy.com/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actionText">Action Button Text (Optional)</Label>
          <Input
            id="actionText"
            value={form.actionText || ''}
            onChange={(e) => setForm({ ...form, actionText: e.target.value })}
            placeholder="View Details"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userName">User Name (Optional)</Label>
          <Input
            id="userName"
            value={form.userName || ''}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </>
    ),
    subscription_confirmation: (
      <>
        <div className="space-y-2">
          <Label htmlFor="planName">Plan Name *</Label>
          <Input
            id="planName"
            value={form.planName || ''}
            onChange={(e) => setForm({ ...form, planName: e.target.value })}
            placeholder="Pro Plan"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="userName">User Name (Optional)</Label>
          <Input
            id="userName"
            value={form.userName || ''}
            onChange={(e) => setForm({ ...form, userName: e.target.value })}
            placeholder="John Doe"
          />
        </div>
      </>
    ),
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Notification Management</h1>
        <p className="text-sm text-gray-600">Send email notifications to users using Resend</p>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList>
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">Send History</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Email Notification
              </CardTitle>
              <CardDescription>
                Choose a template and configure the notification details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="template">Email Template *</Label>
                  <Select
                    value={form.template}
                    onValueChange={(value) => setForm({ ...form, template: value as EmailTemplateType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome Email</SelectItem>
                      <SelectItem value="simulation_complete">Simulation Complete</SelectItem>
                      <SelectItem value="weekly_summary">Weekly Summary</SelectItem>
                      <SelectItem value="general">General Notification</SelectItem>
                      <SelectItem value="subscription_confirmation">Subscription Confirmation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients *</Label>
                  <Select
                    value={form.recipients}
                    onValueChange={(value) => setForm({ ...form, recipients: value as 'all' | 'selected' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="selected">Selected Email Addresses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.recipients === 'selected' && (
                  <div className="space-y-2">
                    <Label htmlFor="selectedEmails">Email Addresses (one per line) *</Label>
                    <Textarea
                      id="selectedEmails"
                      value={form.selectedEmails}
                      onChange={(e) => setForm({ ...form, selectedEmails: e.target.value })}
                      placeholder="user1@example.com&#10;user2@example.com"
                      rows={5}
                      required={form.recipients === 'selected'}
                    />
                  </div>
                )}

                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Template Parameters</h3>
                  {templateFields[form.template]}
                </div>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-none"
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Emails
                      </>
                    )}
                  </Button>
                  {lastResult && (
                    <div className="flex items-center gap-4 text-sm">
                      {lastResult.success ? (
                        <>
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {lastResult.sent} sent
                          </Badge>
                          {lastResult.failed > 0 && (
                            <Badge variant="outline" className="text-red-700 border-red-300">
                              <XCircle className="mr-1 h-3 w-3" />
                              {lastResult.failed} failed
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-red-700 border-red-300">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Send History
              </CardTitle>
              <CardDescription>
                Recent email notification sends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Send history will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

