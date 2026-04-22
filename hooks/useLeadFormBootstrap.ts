'use client';

import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { Lead } from '@/types';
import { useStore } from '@/store';

export type LeadFormBootstrapState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lead: Lead | null };

function normalizeLeadFromApi(raw: Record<string, unknown>): Lead {
  return {
    ...(raw as unknown as Lead),
    id: String(raw.id ?? raw._id),
  };
}

/**
 * Loads reference data (users, influencers, leads list) and optionally the lead being edited.
 * Use this to gate rendering LeadForm until dropdown options and lead row are consistent.
 */
export function useLeadFormBootstrap(leadId: string | undefined): LeadFormBootstrapState {
  const [state, setState] = useState<LeadFormBootstrapState>({ status: 'loading' });
  const loadUsers = useStore((s) => s.loadUsers);
  const loadInfluencers = useStore((s) => s.loadInfluencers);
  const loadLeads = useStore((s) => s.loadLeads);
  const token = useStore((s) => s.token);

  const runGenerationRef = useRef(0);
  const key = leadId ?? '__create__';

  useEffect(() => {
    const gen = ++runGenerationRef.current;
    let cancelled = false;

    // Reset to loading on every new target so consumers don't flash stale `ready` data.
    // This is the canonical shape for "re-fetch when prop changes"; the one-extra render
    // is negligible here and avoids the render-phase-ref alternative (banned by lint).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading' });

    const run = async () => {
      try {
        await Promise.all([loadUsers(), loadInfluencers(), loadLeads()]);
        if (cancelled || gen !== runGenerationRef.current) return;

        if (!leadId) {
          setState({ status: 'ready', lead: null });
          return;
        }

        const res = await fetch(`${API_BASE_URL}/sales/leads/${leadId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        });
        if (cancelled || gen !== runGenerationRef.current) return;

        if (!res.ok) {
          const message =
            res.status === 404
              ? 'Lead not found or you do not have access.'
              : 'Failed to load lead.';
          setState({ status: 'error', message });
          return;
        }

        const raw = (await res.json()) as Record<string, unknown>;
        if (cancelled || gen !== runGenerationRef.current) return;
        setState({ status: 'ready', lead: normalizeLeadFromApi(raw) });
      } catch {
        if (!cancelled && gen === runGenerationRef.current) {
          setState({ status: 'error', message: 'Failed to load lead. Please try again.' });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [key, leadId, loadUsers, loadInfluencers, loadLeads, token]);

  return state;
}
