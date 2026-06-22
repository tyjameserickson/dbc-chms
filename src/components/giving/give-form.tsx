'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRESET_AMOUNTS = [25, 50, 100, 250]

interface Fund { id: string; name: string }

interface Props { funds: Fund[] }

export function GiveForm({ funds }: Props) {
  const [step, setStep] = useState<'amount' | 'payment'>('amount')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [fundId, setFundId] = useState(funds[0]?.id ?? '')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [note, setNote] = useState('')

  const selectedFund = funds.find(f => f.id === fundId)

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    const cents = Math.round(parseFloat(amount) * 100)
    if (!cents || cents < 100) { setError('Minimum donation is $1.00'); return }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: cents,
        fund_id: fundId,
        fund_name: selectedFund?.name,
        donor_name: donorName,
        donor_email: donorEmail,
        note,
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }
    setClientSecret(data.clientSecret)
    setStep('payment')
    setLoading(false)
  }

  if (step === 'payment' && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
        <CheckoutForm
          amount={amount}
          fundName={selectedFund?.name ?? ''}
          donorEmail={donorEmail}
          onBack={() => setStep('amount')}
        />
      </Elements>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>Make a Gift</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleContinue} className="space-y-5">
          {/* Fund */}
          <div className="space-y-1.5">
            <Label>Giving Fund</Label>
            <Select value={fundId} onValueChange={v => v && setFundId(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {funds.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset amounts */}
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_AMOUNTS.map(a => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                    amount === String(a)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="Other amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Donor info */}
          <div className="space-y-1.5">
            <Label>Your Name</Label>
            <Input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <Label>Email (for receipt)</Label>
            <Input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="jane@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Note <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="In memory of…" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Please wait…' : `Continue${amount ? ` — $${parseFloat(amount || '0').toFixed(2)}` : ''}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function CheckoutForm({ amount, fundName, donorEmail, onBack }: {
  amount: string; fundName: string; donorEmail: string; onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/give/success`,
        receipt_email: donorEmail || undefined,
      },
    })

    if (error) {
      setError(error.message ?? 'Payment failed')
      setLoading(false)
    }
    // On success Stripe redirects to /give/success
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <p className="text-sm text-slate-500">
          ${parseFloat(amount).toFixed(2)} to {fundName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <PaymentElement />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !stripe}>
            {loading ? 'Processing…' : `Give $${parseFloat(amount).toFixed(2)}`}
          </Button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-slate-500 hover:text-slate-800"
          >
            ← Back
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
