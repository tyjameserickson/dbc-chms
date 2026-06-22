'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Heart } from 'lucide-react'
import { format } from 'date-fns'

const methodLabels: Record<string, string> = {
  card: 'Card', ach: 'ACH', cash: 'Cash', check: 'Check', other: 'Other'
}

interface Props {
  transactions: any[]
  funds: any[]
}

export function GivingList({ transactions, funds }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localTransactions, setLocalTransactions] = useState(transactions)

  const [form, setForm] = useState({
    donor_name: '', fund_id: funds[0]?.id ?? '',
    amount: '', method: 'cash', check_number: '',
    given_at: new Date().toISOString().split('T')[0], notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    // Try to find person by name
    let person_id = null
    if (form.donor_name.trim()) {
      const parts = form.donor_name.trim().split(' ')
      const first = parts[0]
      const last = parts.slice(1).join(' ') || ''
      const { data: people } = await supabase
        .from('people')
        .select('id')
        .ilike('first_name', first)
        .ilike('last_name', `%${last}%`)
        .limit(1)
      person_id = people?.[0]?.id ?? null
    }

    const payload = {
      person_id,
      fund_id: form.fund_id,
      amount: parseFloat(form.amount),
      method: form.method,
      check_number: form.check_number || null,
      given_at: new Date(form.given_at).toISOString(),
      notes: form.notes || null,
    }

    const { data, error } = await supabase
      .from('giving_transactions')
      .insert(payload)
      .select('*, people(first_name, last_name), funds(name)')
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setLocalTransactions(t => [data, ...t])
      setOpen(false)
      setLoading(false)
      setForm(f => ({ ...f, donor_name: '', amount: '', check_number: '', notes: '' }))
    }
  }

  const filtered = localTransactions.filter(t => {
    const name = t.people ? `${t.people.first_name} ${t.people.last_name}`.toLowerCase() : ''
    return name.includes(search.toLowerCase()) || t.funds?.name?.toLowerCase().includes(search.toLowerCase())
  })

  const total = filtered.reduce((sum, t) => sum + Number(t.amount), 0)
  const thisMonth = filtered.filter(t => {
    const d = new Date(t.given_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Giving</h2>
          <p className="text-sm text-slate-500">{localTransactions.length} transactions</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Record Gift</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record a Gift</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Donor Name</Label>
                <Input placeholder="First Last" value={form.donor_name} onChange={e => set('donor_name', e.target.value)} />
                <p className="text-xs text-slate-400">Leave blank for anonymous</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Amount *</Label>
                  <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={form.given_at} onChange={e => set('given_at', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fund *</Label>
                  <Select value={form.fund_id} onValueChange={v => v && set('fund_id', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {funds.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Method *</Label>
                  <Select value={form.method} onValueChange={v => v && set('method', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(methodLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.method === 'check' && (
                <div className="space-y-1.5">
                  <Label>Check Number</Label>
                  <Input value={form.check_number} onChange={e => set('check_number', e.target.value)} />
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving…' : 'Record Gift'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">This Month</p>
            <p className="text-2xl font-bold text-slate-900">${thisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">All Time</p>
            <p className="text-2xl font-bold text-slate-900">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search by donor or fund…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Heart className="w-8 h-8 mx-auto mb-3 opacity-30" />
          {localTransactions.length === 0 ? 'No giving records yet. Record your first gift above.' : 'No results match your search.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Donor</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Fund</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Method</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {t.people ? (
                      <Link href={`/people/${t.person_id}`} className="hover:text-blue-700">
                        {t.people.first_name} {t.people.last_name}
                      </Link>
                    ) : <span className="text-slate-400">Anonymous</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{t.funds?.name}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{methodLabels[t.method]}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{format(new Date(t.given_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">${Number(t.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
