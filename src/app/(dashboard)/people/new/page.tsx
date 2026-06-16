import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { AddPersonForm } from '@/components/people/add-person-form'

export default async function NewPersonPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <>
      <Topbar title="Add Person" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <AddPersonForm />
        </div>
      </main>
    </>
  )
}
