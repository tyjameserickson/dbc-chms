'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, UserCheck, Phone, Mail, Filter } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  visitor: 'Visitor', attendee: 'Attendee', member: 'Member', inactive: 'Inactive',
  elder: 'Elder', pastor: 'Pastor', assistant_pastor: 'Asst. Pastor',
  worship_leader: 'Worship Leader', worship_pastor: 'Worship Pastor',
}

const VOLUNTEER_ROLES = [
  'Greeter', 'Usher', 'Worship Team', 'Sound/Tech', 'Children\'s Ministry',
  'Youth Ministry', 'Parking', 'Hospitality', 'Prayer Team', 'Media/Livestream',
  'Setup/Teardown', 'Security', 'Office Help', 'Other',
]

interface Person {
  id: string
  first_name: string
  last_name: string
  email: string | null
  mobile: string | null
  status: string
}

interface Props { people: Person[]; groups: any[] }

export function VolunteersView({ people }: Props) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  // Local volunteer role assignments (in a real app these would be stored in DB)
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})
  const [assigning, setAssigning] = useState<string | null>(null)

  // People eligible to volunteer (active statuses)
  const eligible = people.filter(p => !['inactive', 'visitor'].includes(p.status))

  const filtered = eligible.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase()
    const matchesSearch = !search || name.includes(search.toLowerCase())
    const personRoles = assignments[p.id] ?? []
    const matchesRole = !roleFilter || personRoles.includes(roleFilter)
    return matchesSearch && matchesRole
  })

  function toggleRole(personId: string, role: string) {
    setAssignments(a => {
      const current = a[personId] ?? []
      return {
        ...a,
        [personId]: current.includes(role)
          ? current.filter(r => r !== role)
          : [...current, role],
      }
    })
  }

  const totalVolunteers = eligible.filter(p => (assignments[p.id]?.length ?? 0) > 0).length
  const byRole = VOLUNTEER_ROLES.map(r => ({
    role: r,
    count: Object.values(assignments).filter(roles => roles.includes(r)).length,
  })).filter(r => r.count > 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Volunteers</h2>
        <p className="text-sm text-slate-500">{totalVolunteers} volunteer{totalVolunteers !== 1 ? 's' : ''} assigned across {byRole.length} role{byRole.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Role summary cards */}
      {byRole.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {byRole.map(r => (
            <button
              key={r.role}
              onClick={() => setRoleFilter(roleFilter === r.role ? null : r.role)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                roleFilter === r.role
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-slate-200 hover:border-blue-200'
              }`}
            >
              <p className="text-lg font-bold text-slate-900">{r.count}</p>
              <p className="text-xs text-slate-500 leading-tight">{r.role}</p>
            </button>
          ))}
        </div>
      )}

      {/* Search & filter bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search volunteers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {roleFilter && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRoleFilter(null)}>
            <Filter className="w-3.5 h-3.5" /> {roleFilter} ×
          </Button>
        )}
      </div>

      {/* People list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <UserCheck className="w-8 h-8 mx-auto mb-3 opacity-30" />
            {search || roleFilter ? 'No volunteers match your search.' : 'No eligible volunteers found.'}
          </div>
        ) : (
          filtered.map(person => {
            const roles = assignments[person.id] ?? []
            const isExpanded = assigning === person.id

            return (
              <Card key={person.id} className="overflow-hidden">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          {person.first_name} {person.last_name}
                        </span>
                        <span className="text-xs text-slate-400">{STATUS_LABELS[person.status] ?? person.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        {person.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{person.email}</span>}
                        {person.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{person.mobile}</span>}
                      </div>
                      {roles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {roles.map(r => (
                            <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={roles.length > 0 ? 'outline' : 'ghost'}
                      className="h-8 text-xs shrink-0"
                      onClick={() => setAssigning(isExpanded ? null : person.id)}
                    >
                      {isExpanded ? 'Done' : roles.length > 0 ? 'Edit Roles' : 'Assign'}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-500 mb-2 font-medium">Select roles for {person.first_name}:</p>
                      <div className="flex flex-wrap gap-2">
                        {VOLUNTEER_ROLES.map(role => (
                          <button
                            key={role}
                            onClick={() => toggleRole(person.id, role)}
                            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                              roles.includes(role)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
