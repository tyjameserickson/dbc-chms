'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type Person } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Plus, Filter } from 'lucide-react'

const statusColors: Record<string, string> = {
  visitor:          'bg-amber-100 text-amber-700',
  attendee:         'bg-blue-100 text-blue-700',
  member:           'bg-green-100 text-green-700',
  inactive:         'bg-slate-100 text-slate-500',
  elder:            'bg-purple-100 text-purple-700',
  pastor:           'bg-indigo-100 text-indigo-700',
  assistant_pastor: 'bg-indigo-100 text-indigo-600',
  worship_leader:   'bg-rose-100 text-rose-700',
  worship_pastor:   'bg-rose-100 text-rose-800',
}

const statusLabels: Record<string, string> = {
  visitor:          'Visitor',
  attendee:         'Attendee',
  member:           'Member',
  inactive:         'Inactive',
  elder:            'Elder',
  pastor:           'Pastor',
  assistant_pastor: 'Asst. Pastor',
  worship_leader:   'Worship Leader',
  worship_pastor:   'Worship Pastor',
}

interface PeopleListProps {
  people: Person[]
}

export function PeopleList({ people }: PeopleListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = people.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase()
    const matchesSearch = name.includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">People</h2>
          <p className="text-sm text-slate-500">{people.length} total</p>
        </div>
        <Link href="/people/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Person
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'visitor', 'attendee', 'member', 'elder', 'pastor', 'assistant_pastor', 'worship_leader', 'worship_pastor', 'inactive'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'All' : (statusLabels[s] ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          {people.length === 0
            ? 'No people yet. Add your first person to get started.'
            : 'No results match your search.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(person => (
                <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/people/${person.id}`} className="flex items-center gap-3 group">
                      <Avatar className="h-8 w-8 shrink-0">
                        {person.photo_url && <AvatarImage src={person.photo_url} />}
                        <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                          {person.first_name[0]}{person.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors">
                        {person.first_name} {person.last_name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{person.email ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{person.mobile ?? person.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[person.status]}`}>
                      {person.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
