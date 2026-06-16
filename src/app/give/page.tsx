import { createClient } from '@/lib/supabase/server'
import { GiveForm } from '@/components/giving/give-form'

export default async function GivePage() {
  const supabase = await createClient()
  const { data: funds } = await supabase
    .from('funds')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Desert Bible Church</h1>
          <p className="text-sm text-slate-500 mt-1">Give Online</p>
        </div>
        <GiveForm funds={funds ?? []} />
        <p className="text-center text-xs text-slate-400">
          Secure payments powered by Stripe. Your giving is tax-deductible.
        </p>
      </div>
    </div>
  )
}
