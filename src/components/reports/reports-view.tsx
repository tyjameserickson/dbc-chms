'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, Calendar, TrendingUp, Download } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns'

interface Props {
  people: any[]
  giving: any[]
  services: any[]
  attendance: any[]
  funds: any[]
}

const STATUS_LABELS: Record<string, string> = {
  visitor: 'Visitor', attendee: 'Attendee', member: 'Member', inactive: 'Inactive',
  elder: 'Elder', pastor: 'Pastor', assistant_pastor: 'Asst. Pastor',
  worship_leader: 'Worship Leader', worship_pastor: 'Worship Pastor',
}

const STATUS_COLORS: Record<string, string> = {
  visitor: 'bg-amber-400', attendee: 'bg-blue-400', member: 'bg-green-400',
  inactive: 'bg-slate-300', elder: 'bg-purple-400', pastor: 'bg-indigo-500',
  assistant_pastor: 'bg-indigo-400', worship_leader: 'bg-rose-400', worship_pastor: 'bg-rose-500',
}

function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function ReportsView({ people, giving, services, attendance, funds }: Props) {
  const [tab, setTab] = useState<'people' | 'giving' | 'attendance'>('people')

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)

  // People stats
  const statusCounts = people.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1
    return acc
  }, {})
  const newThisMonth = people.filter(p =>
    isWithinInterval(parseISO(p.created_at), { start: thisMonthStart, end: thisMonthEnd })
  ).length

  // Giving stats
  const totalGiving = giving.reduce((s, g) => s + Number(g.amount), 0)
  const thisMonthGiving = giving
    .filter(g => isWithinInterval(parseISO(g.given_at), { start: thisMonthStart, end: thisMonthEnd }))
    .reduce((s, g) => s + Number(g.amount), 0)

  const givingByFund = funds.map(f => ({
    name: f.name,
    total: giving.filter(g => g.fund_id === f.id).reduce((s, g) => s + Number(g.amount), 0),
  })).filter(f => f.total > 0).sort((a, b) => b.total - a.total)

  // Last 6 months giving
  const monthlyGiving = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const total = giving
      .filter(g => isWithinInterval(parseISO(g.given_at), { start, end }))
      .reduce((s, g) => s + Number(g.amount), 0)
    return { month: format(d, 'MMM'), total }
  })
  const maxMonthly = Math.max(...monthlyGiving.map(m => m.total), 1)

  // Attendance stats
  const attendanceByService = services.map(s => ({
    ...s,
    count: attendance.filter(a => a.service_id === s.id).length,
  }))
  const avgAttendance = attendanceByService.length
    ? Math.round(attendanceByService.reduce((s, a) => s + a.count, 0) / attendanceByService.length)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500">Overview of your church's people, giving, and attendance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Users className="w-3.5 h-3.5" /> Total People</div>
            <p className="text-2xl font-bold text-slate-900">{people.length}</p>
            <p className="text-xs text-green-600 mt-0.5">+{newThisMonth} this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><DollarSign className="w-3.5 h-3.5" /> This Month</div>
            <p className="text-2xl font-bold text-slate-900">${thisMonthGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-400 mt-0.5">YTD: ${totalGiving.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Calendar className="w-3.5 h-3.5" /> Services</div>
            <p className="text-2xl font-bold text-slate-900">{services.length}</p>
            <p className="text-xs text-slate-400 mt-0.5">recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><TrendingUp className="w-3.5 h-3.5" /> Avg Attendance</div>
            <p className="text-2xl font-bold text-slate-900">{avgAttendance}</p>
            <p className="text-xs text-slate-400 mt-0.5">per service</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['people', 'giving', 'attendance'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* People report */}
      {tab === 'people' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm" variant="outline"
              className="gap-2"
              onClick={() => exportCSV('people-report.csv',
                ['Status', 'Count'],
                Object.entries(statusCounts).map(([k, v]) => [STATUS_LABELS[k] ?? k, v])
              )}
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">People by Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-600 shrink-0">{STATUS_LABELS[status] ?? status}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-400'}`}
                      style={{ width: `${(count / people.length) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 w-8 text-right">{count}</div>
                </div>
              ))}
              {Object.keys(statusCounts).length === 0 && (
                <p className="text-sm text-slate-400">No people records yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Giving report */}
      {tab === 'giving' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => exportCSV('giving-report.csv',
                ['Month', 'Total'],
                monthlyGiving.map(m => [m.month, `$${m.total.toFixed(2)}`])
              )}
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Giving (Last 6 Months)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {monthlyGiving.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500">${m.total > 0 ? m.total.toLocaleString() : ''}</span>
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(m.total / maxMonthly) * 80}px`, minHeight: m.total > 0 ? '4px' : '0' }}
                    />
                    <span className="text-xs text-slate-400">{m.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Giving by Fund</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {givingByFund.length === 0 ? (
                <p className="text-sm text-slate-400">No giving records yet.</p>
              ) : givingByFund.map(f => (
                <div key={f.name} className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">{f.name}</span>
                  <span className="font-semibold text-slate-900">${f.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance report */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm" variant="outline" className="gap-2"
              onClick={() => exportCSV('attendance-report.csv',
                ['Service', 'Date', 'Attendance'],
                attendanceByService.map(s => [s.name, s.service_date, s.count])
              )}
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Services</CardTitle></CardHeader>
            <CardContent>
              {attendanceByService.length === 0 ? (
                <p className="text-sm text-slate-400">No services recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {attendanceByService.map(s => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.service_date ? format(parseISO(s.service_date), 'EEE, MMM d yyyy') : ''}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((s.count / Math.max(...attendanceByService.map(a => a.count), 1)) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 w-6 text-right">{s.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
