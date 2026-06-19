import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { ReportsView } from '@/components/reports/reports-view'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: people },
    { data: giving },
    { data: services },
    { data: attendance },
    { data: funds },
  ] = await Promise.all([
    supabase.from('people').select('id, status, created_at'),
    supabase.from('giving_transactions').select('amount, given_at, fund_id'),
    supabase.from('services').select('id, name, service_date, type').order('service_date', { ascending: false }).limit(20),
    supabase.from('attendance').select('service_id, person_id'),
    supabase.from('funds').select('id, name'),
  ])

  return (
    <>
      <Topbar title="Reports" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <ReportsView
            people={people ?? []}
            giving={giving ?? []}
            services={services ?? []}
            attendance={attendance ?? []}
            funds={funds ?? []}
          />
        </div>
      </main>
    </>
  )
}
