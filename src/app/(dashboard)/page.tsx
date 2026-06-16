import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Heart, CheckSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastSunday = new Date(now)
  lastSunday.setDate(now.getDate() - now.getDay())
  lastSunday.setHours(0, 0, 0, 0)

  const [
    { count: totalPeople },
    { count: newVisitors },
    { data: givingData },
    { data: lastService },
  ] = await Promise.all([
    supabase.from('people').select('*', { count: 'exact', head: true }).neq('status', 'inactive'),
    supabase.from('people').select('*', { count: 'exact', head: true }).eq('status', 'visitor').gte('created_at', firstOfMonth),
    supabase.from('giving_transactions').select('amount').gte('given_at', firstOfMonth),
    supabase.from('services').select('id, name, service_date, attendance(count)').order('service_date', { ascending: false }).limit(1),
  ])

  const monthlyGiving = (givingData ?? []).reduce((sum, g) => sum + Number(g.amount), 0)
  const lastAttendance = lastService?.[0]?.attendance?.[0]?.count ?? 0

  const stats = [
    { label: 'Active People',     value: totalPeople ?? 0,  icon: Users,       color: 'text-blue-600',  bg: 'bg-blue-50',  href: '/people' },
    { label: 'Last Service',      value: lastAttendance,    icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50', href: '/attendance' },
    { label: 'Monthly Giving',    value: `$${monthlyGiving.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', href: '/giving' },
    { label: 'New Visitors',      value: newVisitors ?? 0,  icon: TrendingUp,  color: 'text-amber-600', bg: 'bg-amber-50', href: '/people' },
  ]

  return (
    <>
      <Topbar title="Dashboard" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
              <Link key={label} href={href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${bg}`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="text-2xl font-bold text-slate-900">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {[
                { label: '+ Add Person',      href: '/people/new' },
                { label: '+ Record Gift',     href: '/giving' },
                { label: '+ Take Attendance', href: '/attendance' },
                { label: '+ New Event',       href: '/events' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {lastService?.[0] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Last Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-slate-900">{lastService[0].name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{lastService[0].service_date} · {lastAttendance} attended</p>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </>
  )
}
