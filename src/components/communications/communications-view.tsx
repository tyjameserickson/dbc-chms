'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageSquare, Users, CheckCircle } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'member', label: 'Members' },
  { value: 'attendee', label: 'Attendees' },
  { value: 'visitor', label: 'Visitors' },
  { value: 'elder', label: 'Elders' },
  { value: 'pastor', label: 'Pastors' },
  { value: 'assistant_pastor', label: 'Asst. Pastors' },
  { value: 'worship_leader', label: 'Worship Leaders' },
  { value: 'worship_pastor', label: 'Worship Pastors' },
  { value: 'inactive', label: 'Inactive' },
]

interface Person {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
}

interface Props { people: Person[] }

export function CommunicationsView({ people }: Props) {
  const [tab, setTab] = useState<'email' | 'sms'>('email')
  const [audience, setAudience] = useState('all')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const filtered = audience === 'all'
    ? people
    : people.filter(p => p.status === audience)

  const emailRecipients = filtered.filter(p => p.email)
  const smsRecipients   = filtered.filter(p => p.mobile)
  const recipients      = tab === 'email' ? emailRecipients : smsRecipients

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    // Simulate send — real implementation requires Resend (email) or Twilio (SMS)
    setTimeout(() => { setSending(false); setSent(true) }, 1200)
  }

  function handleReset() {
    setSent(false)
    setSubject('')
    setBody('')
    setAudience('all')
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <CheckCircle className="w-14 h-14 text-green-500" />
        <h2 className="text-xl font-semibold text-slate-900">Message Sent!</h2>
        <p className="text-slate-500 text-sm">
          Your {tab === 'email' ? 'email' : 'text message'} was sent to {recipients.length} {recipients.length === 1 ? 'person' : 'people'}.
        </p>
        <Button onClick={handleReset} variant="outline">Compose Another</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Communications</h2>
        <p className="text-sm text-slate-500">Send emails or text messages to your congregation.</p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('email')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'email' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" /> Email
        </button>
        <button
          onClick={() => setTab('sms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'sms' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Text Message
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compose */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Compose</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Send To</Label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAudience(opt.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          audience === opt.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {tab === 'email' && (
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Sunday Service Reminder"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder={tab === 'email'
                      ? 'Dear church family,\n\nWe look forward to seeing you Sunday...'
                      : 'Reminder: Sunday service at 10am. See you there!'
                    }
                    rows={tab === 'email' ? 8 : 4}
                    required
                  />
                  {tab === 'sms' && (
                    <p className={`text-xs ${body.length > 160 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {body.length}/160 characters{body.length > 160 ? ' (will send as multiple texts)' : ''}
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={sending || recipients.length === 0} className="w-full">
                  {sending ? 'Sending…' : `Send to ${recipients.length} ${recipients.length === 1 ? 'person' : 'people'}`}
                </Button>

                {recipients.length === 0 && (
                  <p className="text-xs text-amber-600 text-center">
                    No {tab === 'email' ? 'email addresses' : 'phone numbers'} found for this group.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Recipient preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" /> Recipients
                <Badge variant="secondary">{recipients.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipients.length === 0 ? (
                <p className="text-sm text-slate-400">No recipients in this group.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {recipients.slice(0, 30).map(p => (
                    <div key={p.id} className="text-sm">
                      <p className="font-medium text-slate-800">{p.first_name} {p.last_name}</p>
                      <p className="text-slate-400 text-xs truncate">
                        {tab === 'email' ? p.email : p.mobile}
                      </p>
                    </div>
                  ))}
                  {recipients.length > 30 && (
                    <p className="text-xs text-slate-400">+{recipients.length - 30} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
