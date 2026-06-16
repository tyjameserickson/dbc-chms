import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { AttendanceView } from '@/components/attendance/attendance-view'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: services } = await supabase
    .from('services')
    .select('*, attendance(count)')
    .order('service_date', { ascending: false })
    .limit(20)

  const { data: people } = await supabase
    .from('people')
    .select('id, first_name, last_name, status')
    .neq('status', 'inactive')
    .order('last_name')

  return (
    <>
      <Topbar title="Attendance" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <AttendanceView services={services ?? []} people={people ?? []} />
        </div>
      </main>
    </>
  )
}
