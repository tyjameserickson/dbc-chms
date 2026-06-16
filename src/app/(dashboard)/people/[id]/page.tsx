import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { notFound } from 'next/navigation'
import { PersonDetail } from '@/components/people/person-detail'

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single()

  if (!person) notFound()

  const { data: attendance } = await supabase
    .from('attendance')
    .select('*, services(name, service_date, type)')
    .eq('person_id', id)
    .order('checked_in_at', { ascending: false })
    .limit(10)

  const { data: giving } = await supabase
    .from('giving_transactions')
    .select('*, funds(name)')
    .eq('person_id', id)
    .order('given_at', { ascending: false })
    .limit(10)

  return (
    <>
      <Topbar title={`${person.first_name} ${person.last_name}`} userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <PersonDetail person={person} attendance={attendance ?? []} giving={giving ?? []} />
        </div>
      </main>
    </>
  )
}
