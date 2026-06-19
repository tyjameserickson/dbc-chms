import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { VolunteersView } from '@/components/volunteers/volunteers-view'

export default async function VolunteersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: people } = await supabase
    .from('people')
    .select('id, first_name, last_name, email, mobile, status')
    .order('last_name')

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, type')
    .eq('is_active', true)
    .order('name')

  return (
    <>
      <Topbar title="Volunteers" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <VolunteersView people={people ?? []} groups={groups ?? []} />
        </div>
      </main>
    </>
  )
}
