import { useState, useEffect } from 'react';
import api from '../axios';

export interface TierStatus {
  tier: number;
  name: string;
  status: 'approved' | 'pending' | 'info_requested' | 'available' | null;
  reviewer_note: string | null;
  submission_id: number | null;
  approval_date: string | null;
  submitted_at: string | null;
}

export interface CompanyCapabilities {
  trust_tier: number;
  post_internship: boolean;
  post_internship_max: number | null;
  receive_equity_track_applications: boolean;
  receive_competitive_track_applications: boolean;
  register_supervisors: boolean;
  register_supervisors_max: number | null;
  featured_placement: boolean;
  tier_statuses: Record<string, string | null>;
}

export interface CompanyTierData {
  trustTier: number;
  tiers: TierStatus[];
  capabilities: CompanyCapabilities | null;
  isLoading: boolean;
  isSuspended: boolean;
  actionAvailable: boolean; // true when a tier is ready to submit or needs attention
  refetch: () => void;
}

export function useCompanyTier(): CompanyTierData {
  const [data, setData] = useState<CompanyTierData>({
    trustTier: 1,
    tiers: [],
    capabilities: null,
    isLoading: true,
    isSuspended: false,
    actionAvailable: false,
    refetch: () => {},
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/companies/verification');
      const v = res.data;
      const actionAvailable = v.tiers.some(
        (t: TierStatus) => t.status === 'available' || t.status === 'info_requested'
      );
      setData(prev => ({
        ...prev,
        trustTier: v.trust_tier,
        tiers: v.tiers,
        capabilities: v.capabilities,
        isLoading: false,
        isSuspended: v.is_suspended,
        actionAvailable,
        refetch: fetchData,
      }));
    } catch {
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  return data;
}
