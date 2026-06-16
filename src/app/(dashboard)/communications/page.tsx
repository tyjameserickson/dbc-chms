import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'

export default async function ucommunicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <>
      <Topbar title="ucommunications" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-500">Coming soon — ucommunications module is under construction.</p>
        </div>
      </main>
    </>
  )
}
