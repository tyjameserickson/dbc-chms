'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Calendar, MapPin, Users, Clock } from 'lucide-react'
import { format, isPast, isFuture } from 'date-fns'

interface Props { events: any[] }

export function EventsList({ events: initial }: Props) {
  const [events, setEvents] = useState(initial)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [form, setForm] = useState({
    name: '', description: '', location: '',
    starts_at: '', ends_at: '', capacity: '', is_public: true,
  })

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: form.name,
        description: form.description || null,
        location: form.location || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        is_public: form.is_public,
      })
      .select('*, event_registrations(count)')
      .single()
    if (error) { setError(error.message); setLoading(false) }
    else {
      setEvents(ev => [data, ...ev].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()))
      setOpen(false)
      setLoading(false)
      setForm({ name: '', description: '', location: '', starts_at: '', ends_at: '', capacity: '', is_public: true })
    }
  }

  const upcoming = events.filter(e => isFuture(new Date(e.starts_at)))
  const past     = events.filter(e => isPast(new Date(e.starts_at)))
  const shown    = tab === 'upcoming' ? upcoming : past

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Events</h2>
          <p className="text-sm text-slate-500">{upcoming.length} upcoming</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Event Name *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Sunday Potluck" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Fellowship Hall" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start *</Label>
                  <Input type="datetime-local" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>End</Label>
                  <Input type="datetime-local" value={form.ends_at} onChange={e => set('ends_at', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Capacity (optional)</Label>
                <Input type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="Leave blank for unlimited" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating…' : 'Create Event'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['upcoming', 'past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {/* Events grid */}
      {shown.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Calendar className="w-8 h-8 mx-auto mb-3 opacity-30" />
          {tab === 'upcoming' ? 'No upcoming events. Create one above.' : 'No past events.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shown.map(event => {
            const regCount = event.event_registrations?.[0]?.count ?? 0
            const atCapacity = event.capacity && regCount >= event.capacity
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{event.name}</h3>
                    {atCapacity && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">Full</span>
                    )}
                    {!isPast(new Date(event.starts_at)) && !atCapacity && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 shrink-0">Open</span>
                    )}
                  </div>
                  {event.description && <p className="text-sm text-slate-500">{event.description}</p>}
                  <div className="space-y-1.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {format(new Date(event.starts_at), 'EEE, MMM d · h:mm a')}
                      {event.ends_at && ` – ${format(new Date(event.ends_at), 'h:mm a')}`}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {regCount} registered{event.capacity ? ` / ${event.capacity}` : ''}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
