import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { WorshipDashboard } from '@/components/worship/worship-dashboard'

export default async function WorshipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: services }, { data: songs }] = await Promise.all([
    supabase.from('worship_services').select('*, service_items(count)').order('service_date', { ascending: false }).limit(10),
    supabase.from('songs').select('*').eq('is_active', true).order('title'),
  ])

  return (
    <>
      <Topbar title="Worship" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <WorshipDashboard services={services ?? []} songs={songs ?? []} />
        </div>
      </main>
    </>
  )
}
