import { type ReactNode, useState } from 'react';
import { useAuthStore } from '@/stores/appStore';
import { PricingModal } from './PricingModal';
import { Lock } from 'lucide-react';
import type { PlanTier } from '@/types';

interface Props {
  /** Minimum plan tier required to access the feature */
  requiredTier: PlanTier;
  /** Content to show when authorized */
  children: ReactNode;
  /** Optional fallback to show instead of upgrade prompt */
  fallback?: ReactNode;
}

const TIER_ORDER: PlanTier[] = ['free', 'pro', 'creator_sync_bundle'];

function tierIndex(tier: PlanTier): number {
  return TIER_ORDER.indexOf(tier);
}

export function SubscriptionGate({ requiredTier, children, fallback }: Props) {
  const { subscription } = useAuthStore();
  const [showPricing, setShowPricing] = useState(false);

  const hasAccess = tierIndex(subscription.tier) >= tierIndex(requiredTier);

  if (hasAccess) return <>{children}</>;

  return (
    <>
      {fallback ?? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-forge-surface border border-forge-border flex items-center justify-center">
            <Lock size={16} className="text-forge-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-forge-text mb-1">
              {requiredTier === 'pro' ? 'Pro' : 'CreatorSync Bundle'} Required
            </p>
            <p className="text-xs text-forge-muted">
              Upgrade to access this feature.
            </p>
          </div>
          <button
            onClick={() => setShowPricing(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}
          >
            View Plans
          </button>
        </div>
      )}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </>
  );
}
