// Shared <form> field parsing for TicketOption ("product") create/edit —
// used by both the Master Admin (src/app/admin/(dashboard)/products/actions.ts)
// and the supplier panel (src/app/supplier/(dashboard)/products/actions.ts).
// Only the fields every product shares live here; status/supplierId/
// attractionId/images are caller-specific and handled by each actions.ts.

export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isNaN(n) ? fallback : n;
}

export function optionalInt(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : Math.round(n);
}

export function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on';
}

export function lines(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// Same pattern used across the site's other forms (checkout, supplier
// application) — used to validate supplierContactEmail below.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export type ProductCoreFields = {
  name: string;
  description: string;
  price: number;
  currency: string;
  durationLabel: string;
  freeCancellation: boolean;
  mobileTicket: boolean;
  instantConfirmation: boolean;
  languages: string;
  groupType: string;
  badge: string;
  meetingPointAddress: string;
  meetingPoint: string;
  supplierContactName: string;
  supplierContactEmail: string;
  supplierContactPhone: string;
  cancellationPolicy: string;
  maxGroupSize: number | null;
  availableDays: string;
  timeSlots: string;
  sortOrder: number;
};

export function readProductCoreFields(formData: FormData): ProductCoreFields {
  const availableDays = formData.getAll('availableDays').map(String).filter(Boolean).join(',');
  return {
    name: str(formData, 'name'),
    description: str(formData, 'description'),
    price: num(formData, 'price', 0),
    currency: str(formData, 'currency') || 'EUR',
    durationLabel: str(formData, 'durationLabel'),
    freeCancellation: bool(formData, 'freeCancellation'),
    mobileTicket: bool(formData, 'mobileTicket'),
    instantConfirmation: bool(formData, 'instantConfirmation'),
    languages: str(formData, 'languages'),
    groupType: str(formData, 'groupType'),
    badge: str(formData, 'badge'),
    meetingPointAddress: str(formData, 'meetingPointAddress'),
    meetingPoint: str(formData, 'meetingPoint'),
    supplierContactName: str(formData, 'supplierContactName'),
    supplierContactEmail: str(formData, 'supplierContactEmail').toLowerCase(),
    supplierContactPhone: str(formData, 'supplierContactPhone'),
    cancellationPolicy: str(formData, 'cancellationPolicy'),
    maxGroupSize: optionalInt(formData, 'maxGroupSize'),
    availableDays,
    timeSlots: str(formData, 'timeSlots')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .join(','),
    sortOrder: num(formData, 'sortOrder', 0)
  };
}
