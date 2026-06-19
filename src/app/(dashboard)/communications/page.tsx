import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { CommunicationsView } from '@/components/communications/communications-view'

export default async function CommunicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: people } = await supabase
    .from('people')
    .select('id, first_name, last_name, email, mobile, status')
    .order('last_name')

  return (
    <>
      <Topbar title="Communications" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <CommunicationsView people={people ?? []} />
        </div>
      </main>
    </>
  )
}
