'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Users, MapPin, Clock, ChevronDown, ChevronUp, UserPlus, Trash2 } from 'lucide-react'

const GROUP_TYPES: Record<string, string> = {
  life_group: 'Life Group',
  ministry: 'Ministry',
  committee: 'Committee',
  class: 'Class',
  other: 'Other',
}

const TYPE_COLORS: Record<string, string> = {
  life_group: 'bg-green-100 text-green-700',
  ministry: 'bg-blue-100 text-blue-700',
  committee: 'bg-purple-100 text-purple-700',
  class: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
}

interface Person { id: string; first_name: string; last_name: string; status: string }
interface Props { groups: any[]; people: Person[] }

export function GroupsView({ groups: initial, people }: Props) {
  const [groups, setGroups] = useState(initial)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, any[]>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState('')

  const [form, setForm] = useState({
    name: '', description: '', type: 'life_group',
    meeting_day: '', meeting_time: '', location: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('groups')
      .insert({
        name: form.name,
        description: form.description || null,
        type: form.type,
        meeting_day: form.meeting_day || null,
        meeting_time: form.meeting_time || null,
        location: form.location || null,
        is_active: true,
      })
      .select('*, group_members(count)')
      .single()

    if (error) { setError(error.message); setLoading(false) }
    else {
      setGroups(g => [...g, data].sort((a, b) => a.name.localeCompare(b.name)))
      setOpen(false)
      setLoading(false)
      setForm({ name: '', description: '', type: 'life_group', meeting_day: '', meeting_time: '', location: '' })
    }
  }

  async function loadMembers(groupId: string) {
    if (members[groupId]) return
    const supabase = createClient()
    const { data } = await supabase
      .from('group_members')
      .select('*, people(id, first_name, last_name)')
      .eq('group_id', groupId)
    setMembers(m => ({ ...m, [groupId]: data ?? [] }))
  }

  function toggleExpand(groupId: string) {
    if (expandedId === groupId) {
      setExpandedId(null)
    } else {
      setExpandedId(groupId)
      loadMembers(groupId)
    }
  }

  async function addMember(groupId: string) {
    if (!selectedPerson) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, person_id: selectedPerson, role: 'member' })
      .select('*, people(id, first_name, last_name)')
      .single()

    if (!error && data) {
      setMembers(m => ({ ...m, [groupId]: [...(m[groupId] ?? []), data] }))
      setGroups(g => g.map(gr => gr.id === groupId
        ? { ...gr, group_members: [{ count: (gr.group_members?.[0]?.count ?? 0) + 1 }] }
        : gr
      ))
      setSelectedPerson('')
      setAddingTo(null)
    }
  }

  async function removeMember(groupId: string, memberId: string) {
    const supabase = createClient()
    await supabase.from('group_members').delete().eq('id', memberId)
    setMembers(m => ({ ...m, [groupId]: m[groupId].filter(mb => mb.id !== memberId) }))
    setGroups(g => g.map(gr => gr.id === groupId
      ? { ...gr, group_members: [{ count: Math.max((gr.group_members?.[0]?.count ?? 1) - 1, 0) }] }
      : gr
    ))
  }

  const existingMemberIds = expandedId ? (members[expandedId] ?? []).map((m: any) => m.person_id) : []
  const availablePeople = people.filter(p => !existingMemberIds.includes(p.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Groups</h2>
          <p className="text-sm text-slate-500">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Group</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Group Name *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Young Adults Life Group" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => set('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(GROUP_TYPES).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Meeting Day</Label>
                  <Select value={form.meeting_day} onValueChange={v => set('meeting_day', v)}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <Input type="time" value={form.meeting_time} onChange={e => set('meeting_time', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Room 201" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating…' : 'Create Group'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
          No groups yet. Create your first group above.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const memberCount = group.group_members?.[0]?.count ?? 0
            const expanded = expandedId === group.id
            const groupMembers = members[group.id] ?? []

            return (
              <Card key={group.id} className="overflow-hidden">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{group.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[group.type] ?? TYPE_COLORS.other}`}>
                          {GROUP_TYPES[group.type] ?? group.type}
                        </span>
                      </div>
                      {group.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{group.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                        {group.meeting_day && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {group.meeting_day}{group.meeting_time ? ` · ${group.meeting_time}` : ''}</span>}
                        {group.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {group.location}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(group.id)}
                      className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                      {groupMembers.length === 0 ? (
                        <p className="text-sm text-slate-400">No members yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {groupMembers.map((m: any) => (
                            <div key={m.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{m.people?.first_name} {m.people?.last_name}</span>
                              <button
                                onClick={() => removeMember(group.id, m.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {addingTo === group.id ? (
                        <div className="flex gap-2">
                          <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                            <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue placeholder="Select person…" /></SelectTrigger>
                            <SelectContent>
                              {availablePeople.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.last_name}, {p.first_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="h-8" onClick={() => addMember(group.id)} disabled={!selectedPerson}>Add</Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAddingTo(null); setSelectedPerson('') }}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setAddingTo(group.id)}>
                          <UserPlus className="w-3.5 h-3.5" /> Add Member
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
