'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type Person } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react'
import { format } from 'date-fns'

const statusColors: Record<string, string> = {
  visitor:  'bg-amber-100 text-amber-700',
  attendee: 'bg-blue-100 text-blue-700',
  member:   'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-500',
}

interface Props {
  person: Person
  attendance: any[]
  giving: any[]
}

export function PersonDetail({ person, attendance, giving }: Props) {
  const totalGiving = giving.reduce((sum, g) => sum + Number(g.amount), 0)

  return (
    <div className="space-y-4">
      <Link href="/people" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to People
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                  {person.first_name[0]}{person.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {person.first_name} {person.last_name}
                </h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${statusColors[person.status]}`}>
                  {person.status}
                </span>
              </div>
            </div>
            <Link href={`/people/${person.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" /> Edit
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {person.email && (
              <a href={`mailto:${person.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700">
                <Mail className="w-4 h-4 text-slate-400" /> {person.email}
              </a>
            )}
            {(person.mobile || person.phone) && (
              <a href={`tel:${person.mobile ?? person.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700">
                <Phone className="w-4 h-4 text-slate-400" /> {person.mobile ?? person.phone}
              </a>
            )}
            {person.birthday && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                {format(new Date(person.birthday), 'MMMM d, yyyy')}
              </div>
            )}
            {person.address_line1 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                {person.address_line1}, {person.city} {person.state} {person.zip}
              </div>
            )}
          </div>

          {person.notes && (
            <p className="mt-4 text-sm text-slate-600 bg-slate-50 rounded-md p-3">{person.notes}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Giving summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Giving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">
              ${totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mb-3">lifetime total</p>
            {giving.length === 0 ? (
              <p className="text-sm text-slate-400">No giving records yet.</p>
            ) : (
              <div className="space-y-2">
                {giving.slice(0, 5).map((g: any) => (
                  <div key={g.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{g.funds?.name} · {format(new Date(g.given_at), 'MMM d, yyyy')}</span>
                    <span className="font-medium">${Number(g.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-900">{attendance.length}</p>
            <p className="text-xs text-slate-400 mb-3">services attended</p>
            {attendance.length === 0 ? (
              <p className="text-sm text-slate-400">No attendance records yet.</p>
            ) : (
              <div className="space-y-2">
                {attendance.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="text-sm text-slate-600">
                    {a.services?.name} · {a.services?.service_date && format(new Date(a.services.service_date), 'MMM d, yyyy')}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
