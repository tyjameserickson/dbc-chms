import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { SettingsView } from '@/components/settings/settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <Topbar title="Settings" userEmail={user?.email} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <SettingsView currentUserEmail={user?.email ?? ''} />
        </div>
      </main>
    </>
  )
}
