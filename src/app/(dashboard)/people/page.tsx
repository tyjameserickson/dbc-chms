import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PeopleList } from '@/components/people/people-list'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Will pull real data once DB is connected
  const { data: people } = await supabase
    .from('people')
    .select('*')
    .order('last_name', { ascending: true })
    .limit(100)

  return (
    <>
      <Topbar title="People" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <PeopleList people={people ?? []} />
        </div>
      </main>
    </>
  )
}
