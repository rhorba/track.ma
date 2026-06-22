'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getUsage, createCheckout } from '@/lib/api';

interface Usage {
  tier: string;
  subscriptionStatus: string;
  vehicleCount: number;
  vehicleLimit: number;
  userCount: number;
}

const PLANS = [
  {
    id: 'trial',
    label: 'Trial',
    price: 'Free',
    vehicles: 2,
    priceId: null,
    features: ['2 vehicles', 'Basic alerts', '7-day history'],
  },
  {
    id: 'starter',
    label: 'Starter',
    price: '299 MAD/mo',
    vehicles: 5,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? '',
    features: ['5 vehicles', 'All alert types', '30-day history', 'Email support'],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: '799 MAD/mo',
    vehicles: 25,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? '',
    features: ['25 vehicles', 'All features', '90-day history', 'Priority support'],
    highlight: true,
  },
  {
    id: 'business',
    label: 'Business',
    price: '1,999 MAD/mo',
    vehicles: 9999,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ?? '',
    features: ['Unlimited vehicles', 'All features', '365-day history', 'Dedicated support'],
  },
] as const;

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  past_due: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function BillingPage() {
  const { data: usage } = useSWR<Usage>('usage', getUsage);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!priceId) return;
    setLoading(planId);
    try {
      const session = await createCheckout(priceId, window.location.origin);
      if (session?.url) window.location.href = session.url;
    } finally {
      setLoading(null);
    }
  };

  const vehiclePct = usage ? Math.min((usage.vehicleCount / usage.vehicleLimit) * 100, 100) : 0;
  const nearLimit = vehiclePct >= 80;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Billing & Plans</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your subscription</p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
        {/* Current usage */}
        {usage && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Current plan</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white capitalize mt-0.5">{usage.tier}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[usage.subscriptionStatus] ?? STATUS_BADGE.cancelled}`}>
                {usage.subscriptionStatus}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Vehicles used</span>
                <span className={nearLimit ? 'text-orange-500 font-medium' : ''}>
                  {usage.vehicleCount} / {usage.vehicleLimit === 9999 ? '∞' : usage.vehicleLimit}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${nearLimit ? 'bg-orange-500' : 'bg-blue-600'}`}
                  style={{ width: `${usage.vehicleLimit === 9999 ? 0 : vehiclePct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div>
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Available plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = usage?.tier === plan.id;
              const isHighlight = 'highlight' in plan && plan.highlight;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border p-5 ${
                    isHighlight
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isHighlight && (
                    <span className="absolute -top-2.5 left-4 bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{plan.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-4">{plan.price}</p>
                  <ul className="flex-1 space-y-1.5 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <span className="block text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                      Current plan
                    </span>
                  ) : plan.priceId ? (
                    <button
                      onClick={() => handleCheckout(plan.priceId!, plan.id)}
                      disabled={!!loading}
                      className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 ${
                        isHighlight
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {loading === plan.id ? 'Redirecting…' : 'Upgrade'}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
