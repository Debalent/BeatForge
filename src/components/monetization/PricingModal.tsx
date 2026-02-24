import { useState } from 'react';
import { Check, X, Zap, Crown, Star } from 'lucide-react';
import { PRICING_PLANS, type PricingPlan } from '@/stores/appStore';
import type { BillingPeriod } from '@/types';

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  biennial: '2-Year',
};

const PERIOD_SAVINGS: Record<BillingPeriod, string | null> = {
  monthly: null,
  annual: 'Save 20%',
  biennial: 'Save 33%',
};

const PLAN_ICONS = {
  free: Star,
  pro: Zap,
  creator_sync_bundle: Crown,
};

const PLAN_GRADIENT = {
  free: 'from-slate-600 to-slate-700',
  pro: 'from-forge-highlight to-forge-accent',
  creator_sync_bundle: 'from-amber-500 to-orange-600',
};

interface Props {
  onClose: () => void;
}

function PlanCard({ plan, period, current }: { plan: PricingPlan; period: BillingPeriod; current?: boolean }) {
  const Icon = PLAN_ICONS[plan.tier as keyof typeof PLAN_ICONS] ?? Star;
  const grad = PLAN_GRADIENT[plan.tier as keyof typeof PLAN_GRADIENT] ?? 'from-slate-600 to-slate-700';
  const price = period === 'monthly' ? plan.monthly : period === 'annual' ? plan.annual : plan.biennial;

  return (
    <div className={`relative rounded-2xl border flex flex-col overflow-hidden transition-transform hover:scale-[1.01] ${
      plan.highlight
        ? 'border-forge-highlight/60 bg-forge-surface shadow-lg shadow-forge-highlight/10'
        : 'border-forge-border bg-forge-surface/50'
    }`}>
      {plan.highlight && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-forge-highlight to-forge-accent" />
      )}
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-forge-highlight to-forge-accent text-black text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
          Most Popular
        </div>
      )}

      <div className={`p-5 bg-gradient-to-br ${grad} bg-opacity-10`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br ${grad}`}>
            <Icon size={15} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-forge-text">{plan.label}</h3>
            {current && <span className="text-[9px] text-emerald-400">Current Plan</span>}
          </div>
        </div>

        <div className="flex items-end gap-1">
          <span className="text-3xl font-extrabold text-forge-text">
            {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
          </span>
          {price > 0 && <span className="text-xs text-forge-muted mb-1">/mo</span>}
        </div>
        {period !== 'monthly' && price > 0 && (
          <p className="text-[10px] text-forge-muted mt-0.5">
            billed {period === 'annual' ? 'annually' : 'every 2 years'} (${(price * (period === 'annual' ? 12 : 24)).toFixed(2)})
          </p>
        )}
      </div>

      <div className="flex-1 p-5">
        <ul className="space-y-2 mb-5">
          {plan.features.map((feat) => (
            <li key={feat} className="flex items-start gap-2 text-xs text-forge-text">
              <Check size={11} className="text-emerald-400 mt-0.5 shrink-0" />
              {feat}
            </li>
          ))}
        </ul>

        <button
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 ${
            plan.highlight
              ? 'bg-gradient-to-br from-forge-highlight to-forge-accent text-white'
              : price === 0
                ? 'bg-forge-bg border border-forge-border text-forge-muted hover:text-forge-text'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
          } ${current ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={current}
        >
          {current ? 'Current Plan' : price === 0 ? 'Get Started Free' : `Upgrade to ${plan.label}`}
        </button>
      </div>
    </div>
  );
}

export function PricingModal({ onClose }: Props) {
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-forge-border bg-forge-bg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto forge-scrollbar">
        {/* Header */}
        <div className="relative p-6 pb-4 text-center border-b border-forge-border">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-forge-muted hover:text-forge-text hover:bg-forge-surface transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/BeatForge/icons/logo.png" alt="BeatForge" className="h-6 w-6 object-contain" />
            <span className="text-forge-muted text-sm">BeatForge</span>
          </div>
          <h2 className="text-2xl font-extrabold text-forge-text mb-1">
            Choose Your Plan
          </h2>
          <p className="text-sm text-forge-muted">Unlock professional tools and AI-powered features</p>

          {/* Period toggle */}
          <div className="flex items-center justify-center gap-1 mt-4 bg-forge-surface rounded-full p-1 w-fit mx-auto">
            {(Object.keys(PERIOD_LABELS) as BillingPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  period === p
                    ? 'bg-forge-highlight text-black font-semibold'
                    : 'text-forge-muted hover:text-forge-text'
                }`}
              >
                {PERIOD_LABELS[p]}
                {PERIOD_SAVINGS[p] && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[9px]">
                    {PERIOD_SAVINGS[p]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            {PRICING_PLANS.map((plan) => (
              <PlanCard key={plan.tier} plan={plan} period={period} />
            ))}
          </div>

          <p className="text-center text-[10px] text-forge-muted mt-6">
            All plans include 14-day free trial. No credit card required to start. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
