import { Lead, Influencer } from '@/types';

export const gstStatuses = ['NO', 'YES', 'APPLIED', 'APPLIED_THROUGH_US'] as const;
export type GstStatus = (typeof gstStatuses)[number];

export const leadCallStatuses = ['CONNECTED', 'NOT_CONNECTED', 'BUSY', 'WRONG_NUMBER'] as const;
export type LeadCallStatus = (typeof leadCallStatuses)[number];

function isTrue(val: unknown): boolean {
  return val === true || val === 'true' || val === 1 || val === '1';
}

/**
 * Returns the lead's sourceCode for the dropdown. Preserves the historical value even if
 * the influencer no longer lists it (inactive or removed): the form layer is responsible
 * for injecting an "(inactive)" option so Radix Select can render it without wiping state.
 */
export function resolveSourceCodeForDropdown(
  influencers: Influencer[],
  influencerIdRaw: unknown,
  rawCode: string | undefined
): string {
  const code = String(rawCode ?? '').trim();
  const influencerId =
    influencerIdRaw == null
      ? ''
      : typeof influencerIdRaw === 'string'
        ? influencerIdRaw
        : typeof influencerIdRaw === 'object' &&
            influencerIdRaw !== null &&
            '$oid' in influencerIdRaw
          ? String((influencerIdRaw as { $oid?: string }).$oid || '')
          : String((influencerIdRaw as { toString?: () => string }).toString?.() ?? influencerIdRaw);

  if (!code || !influencerId) return code;
  // Note: we intentionally do NOT wipe `code` when it's missing from the influencer's
  // current source-codes list. Historical codes may be inactive or deleted; the UI will
  // surface this via an "(inactive)" badge in the options list.
  return code;
}

export function extractId(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && '$oid' in v) return String((v as { $oid?: string }).$oid || '');
  if (typeof (v as { toString?: () => string })?.toString === 'function') return (v as { toString: () => string }).toString();
  return String(v);
}

export type LeadFormValues = {
  mobile: string;
  name: string;
  state: string;
  city: string;
  address: string;
  pincode: string;
  email: string;
  influencerId: string;
  sourceCode: string;
  callStatus: '' | LeadCallStatus;
  rating: number | null;
  notes: string;
  followUpDate: Date | null;
  converted: boolean;
  salesAmount: number | null;
  gstStatus: GstStatus;
  paymentInfoShared: boolean;
};

export function mapLeadToFormValues(lead: Lead, influencers: Influencer[]): LeadFormValues {
  const infId = extractId(lead.influencerId);
  const resolvedSourceCode = resolveSourceCodeForDropdown(
    influencers,
    infId,
    String(lead.sourceCode || '')
  );

  const backendAmount = Number(lead.salesAmount || (lead as { amount?: number }).amount || 0);
  const isConverted = isTrue(lead.converted) || backendAmount > 0;

  const resolvedGst: GstStatus =
    (lead as { gstStatus?: string }).gstStatus &&
    gstStatuses.includes((lead as { gstStatus?: string }).gstStatus as GstStatus)
      ? ((lead as { gstStatus: string }).gstStatus as GstStatus)
      : lead.gstStatus === 'YES' ||
          lead.gstStatus === 'APPLIED' ||
          lead.gstStatus === 'APPLIED_THROUGH_US' ||
          isTrue(lead.gst) ||
          isTrue(lead.gstCustomer)
        ? 'YES'
        : 'NO';

  let fDate: Date | null = null;
  if (lead.followUpDate) {
    const parsed = new Date(lead.followUpDate);
    if (!isNaN(parsed.getTime())) fDate = parsed;
  }

  const rawCall = lead.callStatus;
  const callStatus: '' | LeadCallStatus = leadCallStatuses.includes(
    rawCall as LeadCallStatus
  )
    ? (rawCall as LeadCallStatus)
    : '';

  return {
    mobile: String(lead.mobile || ''),
    name: String(lead.name || ''),
    state: String(lead.state || ''),
    city: String(lead.city || ''),
    address: String(lead.address || ''),
    pincode: String(lead.pincode || ''),
    email: String(lead.email || ''),
    influencerId: infId,
    sourceCode: resolvedSourceCode,
    callStatus,
    rating: lead.rating ?? null,
    notes: String(lead.notes || ''),
    followUpDate: fDate,
    converted: isConverted,
    salesAmount: backendAmount || null,
    gstStatus: resolvedGst,
    paymentInfoShared: !!lead.paymentInfoShared,
  };
}
