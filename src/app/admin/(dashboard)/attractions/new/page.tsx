import { createAttraction } from '../actions';

export default function NewAttractionPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">New attraction / tour</h1>
      <p className="text-sm text-gray-500 mb-6">
        Fill in the basics to create the listing — you can add ticket options, photos, highlights and FAQs once it&apos;s
        created.
      </p>

      <form action={createAttraction} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <Field label="Name">
          <input name="name" required className="input" />
        </Field>

        <Field label="Slug" hint="Leave blank to auto-generate from the name (used in the page URL).">
          <input name="slug" className="input" placeholder="e.g. park-guell" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select name="category" className="input" defaultValue="attraction">
              <option value="attraction">Attraction</option>
              <option value="tour">Tour</option>
              <option value="show">Show</option>
            </select>
          </Field>
          <Field label="Category label" hint="Shown on cards, e.g. “Architecture & landmarks”">
            <input name="categoryLabel" className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select name="status" className="input" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Badge" hint="e.g. “Best seller”, leave blank for none">
            <input name="badge" className="input" />
          </Field>
        </div>

        <Field label="Short description" hint="Shown on cards and at the top of the page">
          <textarea name="shortDescription" rows={2} className="input" required />
        </Field>

        <Field label="Long description" hint="Paragraphs — leave a blank line between paragraphs">
          <textarea name="longDescription" rows={6} className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Hero image URL">
            <input name="heroImageUrl" className="input" placeholder="/images/attractions/slug/hero.jpg" />
          </Field>
          <Field label="Hero image alt text">
            <input name="heroImageAlt" className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Price from (€)">
            <input name="priceFrom" type="number" step="0.01" className="input" defaultValue={0} />
          </Field>
          <Field label="Rating">
            <input name="rating" type="number" step="0.1" min={0} max={5} className="input" defaultValue={4.5} />
          </Field>
          <Field label="Review count">
            <input name="reviewCount" type="number" className="input" defaultValue={0} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Duration label">
            <input name="durationLabel" className="input" placeholder="e.g. 1–2 hours" />
          </Field>
          <Field label="Sort order" hint="Lower shows first">
            <input name="sortOrder" type="number" className="input" defaultValue={0} />
          </Field>
        </div>

        <Field label="Address / meeting point">
          <input name="address" className="input" />
        </Field>

        <div className="space-y-2 pt-2">
          <Checkbox name="freeCancellation" label="Free cancellation" defaultChecked />
          <Checkbox name="mobileTicket" label="Mobile ticket" defaultChecked />
          <Checkbox
            name="requiresAllTravelerNames"
            label="Requires first + last name for every traveler at checkout (e.g. Sagrada Família)"
          />
          <Checkbox name="featured" label="Show in “Popular Barcelona attractions”" />
          <Checkbox name="popularTour" label="Show in “Popular tours & experiences”" />
        </div>

        <div className="pt-2">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
            Create attraction
          </button>
        </div>
      </form>
    </div>
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

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="rounded border-gray-300" />
      {label}
    </label>
  );
}
