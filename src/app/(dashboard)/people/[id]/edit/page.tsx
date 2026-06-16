import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { notFound } from 'next/navigation'
import { EditPersonForm } from '@/components/people/edit-person-form'

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: person } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single()

  if (!person) notFound()

  return (
    <>
      <Topbar title={`Edit — ${person.first_name} ${person.last_name}`} userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <EditPersonForm person={person} />
        </div>
      </main>
    </>
  )
}
