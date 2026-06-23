'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface Props { currentUserEmail: string }

export function SettingsView({ currentUserEmail }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(null)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${window.location.origin}/accept-invite`,
    })

    if (error) {
      // Admin API not available from client — use our API route instead
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSuccess(`Invitation sent to ${email}`)
        setEmail('')
      }
    } else {
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your church management system.</p>
      </div>

      {/* Current user */}
      <Card>
        <CardHeader><CardTitle className="text-base">Your Account</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Signed in as <span className="font-medium">{currentUserEmail}</span></p>
        </CardContent>
      </Card>

      {/* Invite user */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite a User</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Send an invitation email. They'll receive a link to set their password and access the system.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="pastor@desertbible.org"
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={loading} className="gap-2 shrink-0">
                  <Mail className="w-4 h-4" />
                  {loading ? 'Sending…' : 'Send Invite'}
                </Button>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md p-3">
                <CheckCircle className="w-4 h-4 shrink-0" /> {success}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-md p-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
