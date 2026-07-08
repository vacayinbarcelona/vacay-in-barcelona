import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DeleteButton } from '@/components/admin/DeleteButton';
import {
  updateAttraction,
  deleteAttraction,
  replaceHighlights,
  replaceIncludedItems,
  replaceImportantInfo,
  addTicketOption,
  updateTicketOption,
  deleteTicketOption,
  addFaq,
  updateFaq,
  deleteFaq,
  addImage,
  deleteImage,
  addReview,
  deleteReview
} from '../actions';

async function getAttraction(slug: string) {
  return prisma.attraction.findUnique({
    where: { slug },
    include: {
      ticketOptions: { orderBy: { sortOrder: 'asc' } },
      highlights: { orderBy: { sortOrder: 'asc' } },
      includedItems: { orderBy: { sortOrder: 'asc' } },
      infoItems: { orderBy: { sortOrder: 'asc' } },
      faqs: { orderBy: { sortOrder: 'asc' } },
      reviews: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } }
    }
  });
}

export default async function EditAttractionPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { saved?: string };
}) {
  const [session, attraction] = await Promise.all([getSession(), getAttraction(params.slug)]);
  if (!attraction) notFound();
  const isMaster = session?.role === 'master';

  const boundUpdate = updateAttraction.bind(null, attraction.id, attraction.slug);
  const boundReplaceHighlights = replaceHighlights.bind(null, attraction.id, attraction.slug);
  const boundReplaceIncluded = replaceIncludedItems.bind(null, attraction.id, attraction.slug);
  const boundReplaceInfo = replaceImportantInfo.bind(null, attraction.id, attraction.slug);
  const boundAddTicket = addTicketOption.bind(null, attraction.id, attraction.slug);
  const boundAddFaq = addFaq.bind(null, attraction.id, attraction.slug);
  const boundAddImage = addImage.bind(null, attraction.id, attraction.slug);
  const boundAddReview = addReview.bind(null, attraction.id, attraction.slug);

  const included = attraction.includedItems.filter((i) => i.included).map((i) => i.text);
  const notIncluded = attraction.includedItems.filter((i) => !i.included).map((i) => i.text);

  return (
    <div className="max-w-3xl pb-24">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold">{attraction.name}</h1>
        <Link href={`/attractions/${attraction.slug}`} target="_blank" className="text-xs text-blue-600 font-medium">
          View live page &rarr;
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-6">/attractions/{attraction.slug}</p>

      {searchParams?.saved === '1' ? (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-6">Saved.</p>
      ) : null}

      {/* ------------------------------------------------------------- */}
      {/* Core details                                                  */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="content" title="Details">
        <form action={boundUpdate} className="space-y-4">
          <Field label="Name">
            <input name="name" defaultValue={attraction.name} required className="input" />
          </Field>

          <Field label="Slug" hint="Changing this changes the public URL.">
            <input name="slug" defaultValue={attraction.slug} className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select name="category" defaultValue={attraction.category} className="input">
                <option value="attraction">Attraction</option>
                <option value="tour">Tour</option>
                <option value="show">Show</option>
              </select>
            </Field>
            <Field label="Category label">
              <input name="categoryLabel" defaultValue={attraction.categoryLabel} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select name="status" defaultValue={attraction.status} className="input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Badge">
              <input name="badge" defaultValue={attraction.badge} className="input" />
            </Field>
          </div>

          <Field label="Short description">
            <textarea name="shortDescription" defaultValue={attraction.shortDescription} rows={2} className="input" required />
          </Field>

          <Field label="Long description" hint="Paragraphs — leave a blank line between paragraphs">
            <textarea name="longDescription" defaultValue={attraction.longDescription} rows={8} className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hero image URL">
              <input name="heroImageUrl" defaultValue={attraction.heroImageUrl} className="input" />
            </Field>
            <Field label="Hero image alt text">
              <input name="heroImageAlt" defaultValue={attraction.heroImageAlt} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Price from (€)">
              <input name="priceFrom" type="number" step="0.01" defaultValue={attraction.priceFrom} className="input" />
            </Field>
            <Field label="Rating">
              <input name="rating" type="number" step="0.1" min={0} max={5} defaultValue={attraction.rating} className="input" />
            </Field>
            <Field label="Review count">
              <input name="reviewCount" type="number" defaultValue={attraction.reviewCount} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration label">
              <input name="durationLabel" defaultValue={attraction.durationLabel} className="input" />
            </Field>
            <Field label="Sort order">
              <input name="sortOrder" type="number" defaultValue={attraction.sortOrder} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Address / meeting point">
              <input name="address" defaultValue={attraction.address} className="input" />
            </Field>
            <Field label="Map URL" hint="Leave blank to auto-generate from the address">
              <input name="mapUrl" defaultValue={attraction.mapUrl} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Meta title (SEO)">
              <input name="metaTitle" defaultValue={attraction.metaTitle} className="input" />
            </Field>
            <Field label="Meta description (SEO)">
              <input name="metaDescription" defaultValue={attraction.metaDescription} className="input" />
            </Field>
          </div>

          <div className="space-y-2 pt-2">
            <Checkbox name="freeCancellation" label="Free cancellation" defaultChecked={attraction.freeCancellation} />
            <Checkbox name="mobileTicket" label="Mobile ticket" defaultChecked={attraction.mobileTicket} />
            <Checkbox
              name="requiresAllTravelerNames"
              label="Requires first + last name for every traveler at checkout"
              defaultChecked={attraction.requiresAllTravelerNames}
            />
            <Checkbox name="featured" label="Show in “Popular Barcelona attractions”" defaultChecked={attraction.featured} />
            <Checkbox name="popularTour" label="Show in “Popular tours & experiences”" defaultChecked={attraction.popularTour} />
          </div>

          <div className="pt-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
              Save details
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Highlights / included / important info                       */}
      {/* ------------------------------------------------------------- */}
      <SectionCard title="Highlights" hint="One per line">
        <form action={boundReplaceHighlights} className="space-y-3">
          <textarea name="highlights" defaultValue={attraction.highlights.map((h) => h.text).join('\n')} rows={5} className="input" />
          <button type="submit" className="btn-secondary">
            Save highlights
          </button>
        </form>
      </SectionCard>

      <SectionCard title="What's included" hint="One per line, in two lists">
        <form action={boundReplaceIncluded} className="space-y-4">
          <Field label="Included">
            <textarea name="included" defaultValue={included.join('\n')} rows={4} className="input" />
          </Field>
          <Field label="Not included">
            <textarea name="notIncluded" defaultValue={notIncluded.join('\n')} rows={4} className="input" />
          </Field>
          <button type="submit" className="btn-secondary">
            Save included / not included
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Important information" hint="One per line">
        <form action={boundReplaceInfo} className="space-y-3">
          <textarea name="importantInfo" defaultValue={attraction.infoItems.map((i) => i.text).join('\n')} rows={5} className="input" />
          <button type="submit" className="btn-secondary">
            Save important information
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Ticket options                                                */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="tickets" title="Tickets & tours" hint="Prices, durations and languages shown on the booking widget">
        <div className="space-y-4 mb-6">
          {attraction.ticketOptions.map((ticket) => (
            <form
              key={ticket.id}
              action={updateTicketOption.bind(null, ticket.id, attraction.slug)}
              className="border border-gray-200 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input name="name" defaultValue={ticket.name} placeholder="Ticket name" className="input" />
                <div className="flex items-center gap-2">
                  <input name="price" type="number" step="0.01" defaultValue={ticket.price} placeholder="Price" className="input" />
                  <input name="currency" defaultValue={ticket.currency} placeholder="EUR" className="input w-20" />
                </div>
              </div>
              <textarea name="description" defaultValue={ticket.description} rows={2} placeholder="Description" className="input" />
              <div className="grid grid-cols-3 gap-3">
                <input name="durationLabel" defaultValue={ticket.durationLabel} placeholder="Duration, e.g. 1 hour" className="input" />
                <input name="languages" defaultValue={ticket.languages} placeholder="Languages, comma-separated" className="input" />
                <input name="groupType" defaultValue={ticket.groupType} placeholder="Group type (optional)" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="badge" defaultValue={ticket.badge} placeholder="Badge, e.g. Best seller" className="input" />
                <input name="sortOrder" type="number" defaultValue={ticket.sortOrder} placeholder="Sort order" className="input" />
              </div>
              <div className="flex items-center flex-wrap gap-x-5 gap-y-1">
                <Checkbox name="freeCancellation" label="Free cancellation" defaultChecked={ticket.freeCancellation} />
                <Checkbox name="mobileTicket" label="Mobile ticket" defaultChecked={ticket.mobileTicket} />
                <Checkbox name="instantConfirmation" label="Instant confirmation" defaultChecked={ticket.instantConfirmation} />
              </div>
              <div className="flex items-center justify-between pt-1">
                <button type="submit" className="btn-secondary">
                  Save
                </button>
                <form action={deleteTicketOption.bind(null, ticket.id, attraction.slug)}>
                  <DeleteButton confirmText={`Delete ticket option "${ticket.name}"?`} />
                </form>
              </div>
            </form>
          ))}

          {attraction.ticketOptions.length === 0 ? <p className="text-sm text-gray-400">No ticket options yet.</p> : null}
        </div>

        <p className="text-xs font-medium text-gray-500 mb-2">Add a new ticket option</p>
        <form action={boundAddTicket} className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Ticket name" required className="input" />
            <div className="flex items-center gap-2">
              <input name="price" type="number" step="0.01" placeholder="Price" className="input" />
              <input name="currency" defaultValue="EUR" className="input w-20" />
            </div>
          </div>
          <textarea name="description" rows={2} placeholder="Description" className="input" />
          <div className="grid grid-cols-3 gap-3">
            <input name="durationLabel" placeholder="Duration, e.g. 1 hour" className="input" />
            <input name="languages" placeholder="Languages, comma-separated" defaultValue="English" className="input" />
            <input name="groupType" placeholder="Group type (optional)" className="input" />
          </div>
          <input name="badge" placeholder="Badge, e.g. Best seller (optional)" className="input" />
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1">
            <Checkbox name="freeCancellation" label="Free cancellation" defaultChecked />
            <Checkbox name="mobileTicket" label="Mobile ticket" defaultChecked />
            <Checkbox name="instantConfirmation" label="Instant confirmation" defaultChecked />
          </div>
          <button type="submit" className="btn-secondary">
            + Add ticket option
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Images                                                        */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="images" title="Gallery photos" hint="Real photos only — paste a path under /public/images or a full URL">
        <div className="space-y-2 mb-4">
          {attraction.images.map((img) => (
            <div key={img.id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.altText} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{img.url}</p>
                <p className="text-[11px] text-gray-400 truncate">{img.altText}</p>
              </div>
              <form action={deleteImage.bind(null, img.id, attraction.slug)}>
                <DeleteButton />
              </form>
            </div>
          ))}
          {attraction.images.length === 0 ? <p className="text-sm text-gray-400">No gallery photos yet — the hero image is used as a fallback.</p> : null}
        </div>

        <form action={boundAddImage} className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="url" placeholder="/images/attractions/slug/gallery-2.jpg" required className="input" />
            <input name="altText" placeholder="Alt text (for accessibility & SEO)" className="input" />
          </div>
          <button type="submit" className="btn-secondary">
            + Add photo
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* FAQs                                                          */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="faqs" title="FAQs">
        <div className="space-y-3 mb-4">
          {attraction.faqs.map((faq) => (
            <form key={faq.id} action={updateFaq.bind(null, faq.id, attraction.slug)} className="border border-gray-200 rounded-xl p-4 space-y-2">
              <input name="question" defaultValue={faq.question} placeholder="Question" className="input" />
              <textarea name="answer" defaultValue={faq.answer} rows={2} placeholder="Answer" className="input" />
              <div className="flex items-center justify-between pt-1">
                <button type="submit" className="btn-secondary">
                  Save
                </button>
                <form action={deleteFaq.bind(null, faq.id, attraction.slug)}>
                  <DeleteButton />
                </form>
              </div>
            </form>
          ))}
          {attraction.faqs.length === 0 ? <p className="text-sm text-gray-400">No FAQs yet.</p> : null}
        </div>

        <form action={boundAddFaq} className="border border-dashed border-gray-300 rounded-xl p-4 space-y-2">
          <input name="question" placeholder="Question" required className="input" />
          <textarea name="answer" rows={2} placeholder="Answer" required className="input" />
          <button type="submit" className="btn-secondary">
            + Add FAQ
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Reviews                                                       */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="reviews" title="Customer reviews">
        <div className="space-y-3 mb-4">
          {attraction.reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {review.title} <span className="text-amber-500">{'★'.repeat(review.rating)}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">{review.comment}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {review.authorName} &middot; {review.authorCountry}
                </p>
              </div>
              <form action={deleteReview.bind(null, review.id, attraction.slug)}>
                <DeleteButton />
              </form>
            </div>
          ))}
          {attraction.reviews.length === 0 ? <p className="text-sm text-gray-400">No reviews yet.</p> : null}
        </div>

        <form action={boundAddReview} className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="authorName" placeholder="Name" required className="input" />
            <input name="authorCountry" placeholder="Country" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="title" placeholder="Review title" className="input" />
            <select name="rating" defaultValue={5} className="input">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <textarea name="comment" rows={2} placeholder="Comment" required className="input" />
          <button type="submit" className="btn-secondary">
            + Add review
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Danger zone — master only                                     */}
      {/* ------------------------------------------------------------- */}
      {isMaster ? (
        <div className="border border-red-100 bg-red-50 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">Delete this attraction</p>
            <p className="text-xs text-red-500 mt-0.5">Removes the listing and all its tickets, photos, FAQs and reviews.</p>
          </div>
          <form action={deleteAttraction.bind(null, attraction.id)}>
            <DeleteButton
              label="Delete attraction"
              confirmText={`Delete "${attraction.name}"? This also deletes its tickets, photos, FAQs and reviews. This cannot be undone.`}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-2 rounded-lg"
            />
          </form>
        </div>
      ) : null}
    </div>
  );
}

function SectionCard({ id, title, hint, children }: { id?: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white border border-gray-200 rounded-xl p-6 mb-6 scroll-mt-6">
      <h2 className="text-sm font-semibold mb-1">{title}</h2>
      {hint ? <p className="text-xs text-gray-400 mb-4">{hint}</p> : <div className="mb-4" />}
      {children}
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
