import { step2SaveAndListAction, step2SaveAndPreviousAction, step2SaveAndNextAction } from '@/app/supplier/(dashboard)/products/actions';
import { SupplierContactFields } from '@/components/products/SupplierContactFields';
import { AddressAutocompleteInput } from '@/components/products/AddressAutocompleteInput';

export type Step2Values = {
  meetingPointAddress: string;
  meetingPoint: string;
  meetingPointImage: string;
  supplierContactName: string;
  supplierContactEmail: string;
  supplierContactPhone: string;
};

// Step 2 of the supplier product wizard — meeting point details and the
// supplier contact info shown to customers on their booking confirmation and
// email (see Booking.supplierContactName/Email/Phone). Supplier name isn't
// editable here (see SupplierContactFields showName) — only email and phone
// are collected/required on this screen; whatever name value the product
// already has is carried forward untouched.
export function Step2MeetingPoint({ productId, values, errorMessage }: { productId: string; values: Step2Values; errorMessage?: string }) {
  const saveAndList = step2SaveAndListAction.bind(null, productId);
  const saveAndPrevious = step2SaveAndPreviousAction.bind(null, productId);
  const saveAndNext = step2SaveAndNextAction.bind(null, productId);

  return (
    <form action={saveAndList} encType="multipart/form-data" className="space-y-6">
      {errorMessage ? <p className="text-base text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p> : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-base font-semibold">Meeting point information</p>
        <Field label="Meeting point address" hint="Start typing a place or address — pick a suggestion to fill it in.">
          <AddressAutocompleteInput name="meetingPointAddress" defaultValue={values.meetingPointAddress} placeholder="e.g. Park Güell, Barcelona" />
        </Field>
        <Field label="Meeting instructions" hint="Directions or details beyond the address, e.g. 'Look for the blue umbrella'">
          <textarea name="meetingPoint" defaultValue={values.meetingPoint} rows={2} className="input text-base" />
        </Field>
        <Field label="Meeting point image" hint="Shown to customers after booking, on their confirmation page and email">
          {values.meetingPointImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.meetingPointImage} alt="" className="mb-2 h-24 w-40 object-cover rounded-lg border border-gray-200" />
          ) : null}
          <input type="hidden" name="existingMeetingPointImage" value={values.meetingPointImage} />
          <input type="file" name="meetingPointImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input text-base" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-base font-semibold">Supplier contact information</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Shown to the customer on their booking confirmation and email so they can reach you directly about their booking.
          </p>
        </div>
        <SupplierContactFields
          defaultName={values.supplierContactName}
          defaultEmail={values.supplierContactEmail}
          defaultPhone={values.supplierContactPhone}
          required
          showName={false}
        />
      </div>

      <div className="flex items-center justify-between">
        <button type="submit" formAction={saveAndPrevious} className="border border-gray-300 text-base font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50">
          Previous
        </button>
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
