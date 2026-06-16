import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { GivingList } from '@/components/giving/giving-list'

export default async function GivingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: transactions } = await supabase
    .from('giving_transactions')
    .select('*, people(first_name, last_name), funds(name)')
    .order('given_at', { ascending: false })
    .limit(100)

  const { data: funds } = await supabase
    .from('funds')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <>
      <Topbar title="Giving" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <GivingList transactions={transactions ?? []} funds={funds ?? []} />
        </div>
      </main>
    </>
  )
}
