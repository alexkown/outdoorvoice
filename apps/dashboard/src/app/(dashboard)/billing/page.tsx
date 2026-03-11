import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Billing</h1>
        <p className="text-stone-500 text-sm mt-0.5">Usage and payment management</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-stone-700">Usage This Period</h2>
          <span className="text-xs text-stone-400 ml-1">· Per-minute call charges, reservations, and messages</span>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-7 w-7 text-stone-300" />
          </div>
          <p className="text-sm font-medium text-stone-500">Billing coming soon</p>
          <p className="text-xs text-stone-400 mt-1">
            Stripe metered billing will be set up here
          </p>
        </div>
      </div>
    </div>
  );
}
