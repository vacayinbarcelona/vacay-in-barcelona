import { SupplierContactFields } from './SupplierContactFields';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { AvailabilityScheduleEditor } from './AvailabilityScheduleEditor';
import type { LanguageScheduleDraft } from '@/lib/availabilitySchedule';

export type ProductFormValues = {
  attractionId: string;
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
  meetingPointImage: string;
  supplierContactName: string;
  supplierContactEmail: string;
  supplierContactPhone: string;
  cancellationPolicy: string;
  maxGroupSize: number | null;
  availableDays: string; // CSV, e.g. "Mon,Tue,Wed" — legacy, no longer editable here (see availabilitySchedules)
  timeSlots: string; // CSV, e.g. "09:00,12:30,16:00" — legacy, no longer editable here
  availabilitySchedules: LanguageScheduleDraft[];
  included: string; // newline-separated
  notIncluded: string; // newline-separated
  beforeYouGo: string; // newline-separated
  sortOrder: number;
};

export const EMPTY_PRODUCT_VALUES: ProductFormValues = {
  attractionId: '',
  name: '',
  description: '',
  price: 0,
  currency: 'EUR',
  durationLabel: '',
  freeCancellation: true,
  mobileTicket: true,
  instantConfirmation: true,
  languages: '',
  groupType: '',
  badge: '',
  meetingPointAddress: '',
  meetingPoint: '',
  meetingPointImage: '',
  supplierContactName: '',
  supplierContactEmail: '',
  supplierContactPhone: '',
  cancellationPolicy: '',
  maxGroupSize: null,
  availableDays: '',
  timeSlots: '',
  availabilitySchedules: [],
  included: '',
  notIncluded: '',
  beforeYouGo: '',
  sortOrder: 0
};

// Shared by /admin/products/new, /admin/products/[id], /supplier/products/new
// and /supplier/products/[id]. `categories` is the caller-filtered list of
// Attractions this user is allowed to pick from (all of them for the Master
// Admin; only the ones a supplier has been granted access to). `showInitialPhotoUpload`
// is only true on "new" pages — edit pages manage the photo gallery as its
// own section outside this form (see the [id] pages), since a brand-new
// product has no id yet to attach TicketOptionImage rows to.
export function ProductForm({
  action,
  submitLabel,
  categories,
  values = EMPTY_PRODUCT_VALUES,
  errorMessage,
  showInitialPhotoUpload = false,
  lockCategory = false,
  requireContactInfo = false,
  showBadgeAndSortOrder = true
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  categories: { id: string; name: string }[];
  values?: ProductFormValues;
  errorMessage?: string;
  showInitialPhotoUpload?: boolean;
  lockCategory?: boolean;
  // Supplier contact email/phone are mandatory when a supplier is creating
  // the product (so customers always have a direct contact), but stay
  // optional for the Master Admin's own house products.
  requireContactInfo?: boolean;
  // Badge (homepage/listing ribbon) and sort order (cross-attraction display
  // order) are merchandising controls reserved for the Master Admin — a
  // supplier shouldn't be able to badge their own product "Best seller" or
  // reorder it ahead of others. False on the supplier panel; the fields are
  // also stripped server-side in supplier/products/actions.ts, not just
  // hidden here.
  showBadgeAndSortOrder?: boolean;
}) {
  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {errorMessage ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p> : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <Field label="Category">
          {lockCategory ? (
            <>
              <input type="hidden" name="attractionId" value={values.attractionId} />
              <p className="input bg-gray-50 text-gray-500">{categories.find((c) => c.id === values.attractionId)?.name ?? '—'}</p>
            </>
          ) : (
            <select name="attractionId" required defaultValue={values.attractionId} className="input">
              <option value="" disabled>
                Select a category&hellip;
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Product title">
          <input name="name" defaultValue={values.name} required className="input" placeholder="e.g. Skip-the-Line Entry Ticket" />
        </Field>

        <Field label="Tour / activity description">
          <textarea name="description" defaultValue={values.description} rows={4} className="input" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-sm font-semibold">Availability</p>
          <p className="text-xs text-gray-500 mt-0.5">
            For each language you offer, set a date range, which days within it are bookable, one or more time slots per day, a
            shared total availability for each slot, and the ticket types (with age range and price) sold at each slot.
          </p>
        </div>
        <AvailabilityScheduleEditor initialSchedules={values.availabilitySchedules} />
        <Field label="Duration" hint="Optional — e.g. '2 hours', 'Half day'">
          <input name="durationLabel" defaultValue={values.durationLabel} className="input" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">Pricing</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price per adult">
            <input type="number" name="price" step="0.01" min="0" defaultValue={values.price} required className="input" />
          </Field>
          <Field label="Currency">
            <input name="currency" defaultValue={values.currency} className="input" />
          </Field>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">Meeting point</p>
        <Field label="Meeting Point Address" hint="Start typing a place or address — pick a suggestion to fill it in.">
          <AddressAutocompleteInput name="meetingPointAddress" defaultValue={values.meetingPointAddress} placeholder="e.g. Park Güell, Barcelona" />
        </Field>
        <Field label="Meeting Point Instruction" hint="Directions or details beyond the address, e.g. 'Look for the blue umbrella'">
          <textarea name="meetingPoint" defaultValue={values.meetingPoint} rows={2} className="input" />
        </Field>
        <Field label="Meeting point image" hint="Shown to customers after booking, on their confirmation page and email">
          {values.meetingPointImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.meetingPointImage} alt="" className="mb-2 h-24 w-40 object-cover rounded-lg border border-gray-200" />
          ) : null}
          <input type="hidden" name="existingMeetingPointImage" value={values.meetingPointImage} />
          <input type="file" name="meetingPointImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">Supplier contact</p>
        <p className="text-xs text-gray-500 -mt-2">
          Shown to the customer on their booking confirmation so they can reach you directly about their booking.
        </p>
        <SupplierContactFields
          defaultName={values.supplierContactName}
          defaultEmail={values.supplierContactEmail}
          defaultPhone={values.supplierContactPhone}
          required={requireContactInfo}
        />
      </div>

      {showInitialPhotoUpload ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-sm font-semibold">Product photo</p>
          <Field label="Photo" hint="You can add more photos after creating the product.">
            <input type="file" name="photoFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
          </Field>
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">What&rsquo;s included</p>
        <Field label="What's included" hint="One item per line">
          <textarea name="included" defaultValue={values.included} rows={4} className="input" />
        </Field>
        <Field label="What's not included" hint="One item per line">
          <textarea name="notIncluded" defaultValue={values.notIncluded} rows={3} className="input" />
        </Field>
        <Field label="Before you go" hint="One item per line">
          <textarea name="beforeYouGo" defaultValue={values.beforeYouGo} rows={3} className="input" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">Policies &amp; details</p>
        <Field label="Cancellation policy" hint="Optional — free text shown to customers">
          <textarea name="cancellationPolicy" defaultValue={values.cancellationPolicy} rows={2} className="input" />
        </Field>
        {/* Maximum group size and Languages removed from this section per request —
            their values are preserved via hidden fields (not editable here anymore)
            so re-saving an existing product doesn't wipe out whatever was set before. */}
        <input type="hidden" name="maxGroupSize" defaultValue={values.maxGroupSize ?? ''} />
        <input type="hidden" name="languages" defaultValue={values.languages} />
        <Field label="Group type label" hint="Optional — e.g. 'Small group (max 15)'">
          <input name="groupType" defaultValue={values.groupType} className="input" />
        </Field>
        {showBadgeAndSortOrder ? (
          <Field label="Badge" hint="Optional — e.g. 'Best seller'">
            <input name="badge" defaultValue={values.badge} className="input" />
          </Field>
        ) : null}
        <div className="flex flex-wrap gap-5 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="freeCancellation" defaultChecked={values.freeCancellation} className="h-4 w-4" />
            Free cancellation
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="mobileTicket" defaultChecked={values.mobileTicket} className="h-4 w-4" />
            Mobile ticket
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="instantConfirmation" defaultChecked={values.instantConfirmation} className="h-4 w-4" />
            Instant confirmation
          </label>
        </div>
        {showBadgeAndSortOrder ? (
          <Field label="Sort order" hint="Tie-breaker only — lower shows first">
            <input type="number" name="sortOrder" defaultValue={values.sortOrder} className="input" />
          </Field>
        ) : null}
      </div>

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-gray-400 mt-1 block">{hint}</span> : null}
    </label>
  );
}
