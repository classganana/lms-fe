import type { Lead, Sale } from '@/types';

/**
 * Stable conversion instant for reporting: persisted conversionDate, else linked saleDate, else updatedAt.
 */
export function effectiveConversionDate(lead: Lead, sales: Sale[]): Date | null {
  if (!lead.converted) return null;
  if (lead.conversionDate) return new Date(lead.conversionDate);
  const sale = sales.find((s) => String(s.leadId) === String(lead.id));
  if (sale?.saleDate) return new Date(sale.saleDate);
  return lead.updatedAt ? new Date(lead.updatedAt) : null;
}

export function isConversionInDateRange(
  lead: Lead,
  sales: Sale[],
  from: Date | undefined,
  to: Date | undefined,
): boolean {
  const conv = effectiveConversionDate(lead, sales);
  if (!conv) return false;
  if (from) {
    const f = new Date(from);
    f.setHours(0, 0, 0, 0);
    if (conv < f) return false;
  }
  if (to) {
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    if (conv > t) return false;
  }
  return true;
}

export function isCreatedInDateRange(
  lead: Lead,
  from: Date | undefined,
  to: Date | undefined,
): boolean {
  const d = new Date(lead.createdAt);
  d.setHours(0, 0, 0, 0);
  if (from) {
    const f = new Date(from);
    f.setHours(0, 0, 0, 0);
    if (d < f) return false;
  }
  if (to) {
    const t = new Date(to);
    t.setHours(23, 59, 59, 999);
    if (d > t) return false;
  }
  return true;
}
