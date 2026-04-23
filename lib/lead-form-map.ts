import { Lead, Influencer } from '@/types';

export const gstStatuses = ['NO', 'YES', 'APPLIED', 'APPLIED_THROUGH_US'] as const;
export type GstStatus = (typeof gstStatuses)[number];

export const leadCallStatuses = ['CONNECTED', 'NOT_CONNECTED', 'BUSY', 'WRONG_NUMBER'] as const;
export type LeadCallStatus = (typeof leadCallStatuses)[number];

/** Normalizes followUpDate from JSON (ISO string, {$date}, Date) for the Lead DTO. */
export function coerceFollowUpToIsoString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v === 'object' && v !== null && '$date' in v) {
    const d = new Date(String((v as { $date: string }).$date));
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

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
  const influencerId = extractId(influencerIdRaw);

  if (!code || !influencerId) return code;
  // Note: we intentionally do NOT wipe `code` when it's missing from the influencer's
  // current source-codes list. Historical codes may be inactive or deleted; the UI will
  // surface this via an "(inactive)" badge in the options list.
  return code;
}

/**
 * Stabilizes id-like API values. Handles string ObjectIds, {$oid}, populated refs
 * { _id, name, ... } (Mongoose), and avoids returning "[object Object]".
 */
export function extractId(v: unknown): string {
  let cur: unknown = v;
  for (let d = 0; d < 5; d++) {
    if (cur == null) return '';
    if (typeof cur === 'string') return cur.trim();
    if (typeof cur === 'object' && cur !== null) {
      if ('$oid' in cur) return String((cur as { $oid?: string }).$oid || '').trim();
      if ('_id' in cur) {
        cur = (cur as { _id: unknown })._id;
        continue;
      }
      if ('id' in cur && (cur as { id?: unknown }).id != null) {
        cur = (cur as { id: unknown }).id;
        continue;
      }
    }
    if (cur != null && typeof (cur as { toString?: () => string }).toString === 'function') {
      const ts = (cur as { toString: () => string }).toString;
      if (ts !== Object.prototype.toString) {
        const s = (cur as { toString: () => string }).toString();
        if (typeof s === 'string' && s && s !== '[object Object]') return s.trim();
        if (typeof s === 'string' && /^[a-f0-9]{24}$/i.test(s)) return s;
      }
    }
    break;
  }
  if (v != null && typeof v === 'object') return '';
  return String(v ?? '');
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

  const followRaw = (lead as { followUpDate?: unknown }).followUpDate;
  let fDate: Date | null = null;
  if (followRaw != null) {
    if (followRaw instanceof Date) {
      fDate = isNaN(followRaw.getTime()) ? null : followRaw;
    } else if (typeof followRaw === 'string' || typeof followRaw === 'number') {
      const parsed = new Date(followRaw);
      if (!isNaN(parsed.getTime())) fDate = parsed;
    } else if (typeof followRaw === 'object' && followRaw !== null && '$date' in followRaw) {
      const parsed = new Date(String((followRaw as { $date: string }).$date));
      if (!isNaN(parsed.getTime())) fDate = parsed;
    } else {
      const parsed = new Date(String(followRaw));
      if (!isNaN(parsed.getTime())) fDate = parsed;
    }
  }

  const rawCall = (lead.callStatus as string | undefined) === 'WRONG' ? 'WRONG_NUMBER' : lead.callStatus;
  const callStatus: '' | LeadCallStatus = leadCallStatuses.includes(
    rawCall as LeadCallStatus
  )
    ? (rawCall as LeadCallStatus)
    : '';

  return {
    mobile: String(lead.mobile || ''),
    name: String(lead.name || ''),
    state: String(lead.state || '').trim(),
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
