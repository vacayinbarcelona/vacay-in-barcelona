import { step1SaveAndListAction, step1SaveAndNextAction, deleteSupplierProductImageAction } from '@/app/supplier/(dashboard)/products/actions';

export type Step1Values = {
  attractionId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationLabel: string;
  freeCancellation: boolean;
  mobileTicket: boolean;
  instantConfirmation: boolean;
  cancellationPolicy: string;
  groupType: string;
  included: string;
  notIncluded: string;
  beforeYouGo: string;
};

export const EMPTY_STEP1_VALUES: Step1Values = {
  attractionId: '',
  name: '',
  description: '',
  price: 0,
  currency: 'EUR',
  durationLabel: '',
  freeCancellation: true,
  mobileTicket: true,
  instantConfirmation: true,
  cancellationPolicy: '',
  groupType: '',
  included: '',
  notIncluded: '',
  beforeYouGo: ''
};

// Step 1 of the supplier product wizard — category, title, description,
// duration, what's included/not included/before you go, and photos. Price,
// currency, cancellation policy, group type, and the 3 feature checkboxes
// aren't shown here (no dedicated section) but are still carried forward via
// hidden inputs below so a save never silently drops them.
export function Step1BasicInfo({
  productId,
  categories,
  values,
  photos,
  errorMessage
}: {
  productId: string | null;
  categories: { id: string; name: string }[];
  values: Step1Values;
  photos: { id: string; url: string; altText: string }[];
  errorMessage?: string;
}) {
  const saveAndList = step1SaveAndListAction.bind(null, productId);
  const saveAndNext = step1SaveAndNextAction.bind(null, productId);

  return (
    <form action={saveAndList} encType="multipart/form-data" className="space-y-6">
      {errorMessage ? <p className="text-base text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p> : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-base font-semibold">Basic product information</p>
        <Field label="Product category">
          <select name="attractionId" required defaultValue={values.attractionId} className="input text-base">
            <option value="" disabled>
              Select a category&hellip;
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product title">
          <input name="name" defaultValue={values.name} required className="input text-base" placeholder="e.g. Skip-the-Line Entry Ticket" />
        </Field>
        <Field label="Product description">
          <textarea name="description" defaultValue={values.description} rows={4} className="input text-base" />
        </Field>
        <Field label="Duration" hint="Optional — e.g. '2 hours', 'Half day'">
          <input name="durationLabel" defaultValue={values.durationLabel} className="input text-base" />
        </Field>
      </div>

      {/* Price, currency, cancellation policy, group type, and the 3 feature
          checkboxes no longer have their own visible section — carried
          forward untouched via hidden inputs so a Step 1 save never wipes
          them. Real per-ticket-type pricing lives in Step 3. */}
      <input type="hidden" name="price" value={values.price} />
      <input type="hidden" name="currency" value={values.currency} />
      <input type="hidden" name="cancellationPolicy" value={values.cancellationPolicy} />
      <input type="hidden" name="groupType" value={values.groupType} />
      {values.freeCancellation ? <input type="hidden" name="freeCancellation" value="on" /> : null}
      {values.mobileTicket ? <input type="hidden" name="mobileTicket" value="on" /> : null}
      {values.instantConfirmation ? <input type="hidden" name="instantConfirmation" value="on" /> : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-base font-semibold">What&rsquo;s included</p>
        <Field label="What's included" hint="One item per line">
          <textarea name="included" defaultValue={values.included} rows={4} className="input text-base" />
        </Field>
        <Field label="What's not included" hint="One item per line">
          <textarea name="notIncluded" defaultValue={values.notIncluded} rows={3} className="input text-base" />
        </Field>
        <Field label="Before you go" hint="One item per line">
          <textarea name="beforeYouGo" defaultValue={values.beforeYouGo} rows={3} className="input text-base" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-base font-semibold">Product photos</p>
        {photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((img) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText} className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                {productId ? (
                  <form action={deleteSupplierProductImageAction.bind(null, img.id, productId)} className="absolute top-1 right-1">
                    <button type="submit" className="bg-white/90 text-red-600 text-xs font-medium px-1.5 py-0.5 rounded">
                      Remove
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base text-gray-400">No photos yet.</p>
        )}
        <Field label="Add photos" hint="You can select multiple files at once">
          <input type="file" name="photoFiles" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="input text-base" />
        </Field>
      </div>

      <div className="flex items-center justify-between">
        <span />
        <div className="flex items-center gap-3">
          <button type="submit" className="border border-gray-300 text-base font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50">
            Save as Draft
          </button>
          <button type="submit" formAction={saveAndNext} className="bg-blue-600 hover:bg-blue-700 text-white text-base font-medium px-6 py-2.5 rounded-lg">
            Next
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600 mb-1 block">{label}</span>
      {children}
      {hint ? <span className="text-xs text-gray-400 mt-1 block">{hint}</span> : null}
    </label>
  );
}
