import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function GiveSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900">Thank You!</h1>
        <p className="text-slate-500">
          Your gift has been received. A receipt will be sent to your email.
          We are grateful for your generosity.
        </p>
        <Link
          href="/give"
          className="inline-block mt-4 text-sm text-blue-600 hover:underline"
        >
          Give again
        </Link>
      </div>
    </div>
  )
}
