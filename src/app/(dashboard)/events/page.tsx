import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { EventsList } from '@/components/events/events-list'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: events } = await supabase
    .from('events')
    .select('*, event_registrations(count)')
    .order('starts_at', { ascending: true })
  return (
    <>
      <Topbar title="Events" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <EventsList events={events ?? []} />
        </div>
      </main>
    </>
  )
}
