import { step3SaveAndPreviousAction, step3SaveAsDraftAction, step3PublishAction } from '@/app/supplier/(dashboard)/products/actions';
import { AvailabilityScheduleEditor } from '@/components/products/AvailabilityScheduleEditor';
import type { LanguageScheduleDraft } from '@/lib/availabilitySchedule';

// Step 3 of the supplier product wizard — the full Availability editor
// (language, date range, default ticket availability & configuration,
// generated time slots, per-slot editing) plus the terminal "Publish
// Product" action, which is the only button in this whole wizard that
// actually submits the product to the Master Admin for review (see
// step3PublishAction in actions.ts).
export function Step3Availability({
  productId,
  availabilitySchedules,
  errorMessage
}: {
  productId: string;
  availabilitySchedules: LanguageScheduleDraft[];
  errorMessage?: string;
}) {
  const saveAndPrevious = step3SaveAndPreviousAction.bind(null, productId);
  const saveAsDraft = step3SaveAsDraftAction.bind(null, productId);
  const publish = step3PublishAction.bind(null, productId);

  return (
    <form action={saveAsDraft} className="space-y-6">
      {errorMessage ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p> : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-sm font-semibold">Availability &amp; pricing</p>
          <p className="text-xs text-gray-500 mt-0.5">
            For each language you offer, set a date range, a default number of tickets available and default ticket configuration
            (Adult/Child/Infant/Senior — age ranges, prices, and which types to offer), then select the days and times you&rsquo;re
            open — every generated time slot inherits those defaults automatically, and you can still fine-tune the availability,
            price, age range, or ticket-type visibility of any individual slot afterward without affecting the others.
          </p>
        </div>
        <AvailabilityScheduleEditor initialSchedules={availabilitySchedules} />
      </div>

      <div className="flex items-center justify-between">
        <button type="submit" formAction={saveAndPrevious} className="border border-gray-300 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50">
          Previous
        </button>
        <div className="flex items-center gap-3">
          <button type="submit" className="border border-gray-300 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50">
            Save as Draft
          </button>
          <button type="submit" formAction={publish} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
            Publish Product
          </button>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 -mt-4">
        Publishing sends this product to our team for review before it goes live — it won&rsquo;t appear on the site immediately.
      </p>
    </form>
  );
}
