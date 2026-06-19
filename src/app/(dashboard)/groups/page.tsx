import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { GroupsView } from '@/components/groups/groups-view'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: groups } = await supabase
    .from('groups')
    .select('*, group_members(count)')
    .order('name')

  const { data: people } = await supabase
    .from('people')
    .select('id, first_name, last_name, status')
    .order('last_name')

  return (
    <>
      <Topbar title="Groups" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <GroupsView groups={groups ?? []} people={people ?? []} />
        </div>
      </main>
    </>
  )
}
