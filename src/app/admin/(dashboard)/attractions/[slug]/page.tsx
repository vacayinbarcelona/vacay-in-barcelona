import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { SavedToast } from '@/components/admin/SavedToast';
import { AddressAutocompleteInput } from '@/components/products/AddressAutocompleteInput';
import {
  updateAttraction,
  deleteAttraction,
  replaceHighlights,
  addTicketOption,
  updateTicketOption,
  deleteTicketOption,
  addFaq,
  updateFaq,
  deleteFaq,
  addImage,
  deleteImage,
  addReview,
  deleteReview,
  addQuickFact,
  deleteQuickFact
} from '../actions';

async function getAttraction(slug: string) {
  return prisma.attraction.findUnique({
    where: { slug },
    include: {
      ticketOptions: {
        orderBy: { sortOrder: 'asc' },
        include: {
          includedItems: { orderBy: { sortOrder: 'asc' } },
          infoItems: { orderBy: { sortOrder: 'asc' } }
        }
      },
      highlights: { orderBy: { sortOrder: 'asc' } },
      faqs: { orderBy: { sortOrder: 'asc' } },
      reviews: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      quickFacts: { orderBy: { sortOrder: 'asc' } }
    }
  });
}

export default async function EditAttractionPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { saved?: string; ticketError?: string; error?: string };
}) {
  const [session, attraction] = await Promise.all([getSession(), getAttraction(params.slug)]);
  if (!attraction) notFound();
  const isMaster = session?.role === 'master';

  const boundUpdate = updateAttraction.bind(null, attraction.id, attraction.slug);
  const boundReplaceHighlights = replaceHighlights.bind(null, attraction.id, attraction.slug);
  const boundAddTicket = addTicketOption.bind(null, attraction.id, attraction.slug);
  const boundAddFaq = addFaq.bind(null, attraction.id, attraction.slug);
  const boundAddImage = addImage.bind(null, attraction.id, attraction.slug);
  const boundAddReview = addReview.bind(null, attraction.id, attraction.slug);
  const boundAddQuickFact = addQuickFact.bind(null, attraction.id, attraction.slug);

  return (
    <div className="max-w-3xl pb-24">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold">{attraction.name}</h1>
        <Link href={`/attractions/${attraction.slug}`} target="_blank" className="text-xs text-blue-600 font-medium">
          View live page &rarr;
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-6">/attractions/{attraction.slug}</p>

      <SavedToast />

      {/* ------------------------------------------------------------- */}
      {/* Core details                                                  */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="content" title="Details">
        {searchParams?.error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{searchParams.error}</p>
        ) : null}
        <form action={boundUpdate} encType="multipart/form-data" className="space-y-4">
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

          <Field label="Tagline" hint="Short italic line under the title on the hero, e.g. “Gaudí's Masterpiece”. Leave blank to hide.">
            <input name="tagline" defaultValue={attraction.tagline} className="input" />
          </Field>

          <Field label="Short description">
            <textarea name="shortDescription" defaultValue={attraction.shortDescription} rows={2} className="input" required />
          </Field>

          <Field label="Long description" hint="Paragraphs — leave a blank line between paragraphs">
            <textarea name="longDescription" defaultValue={attraction.longDescription} rows={8} className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hero image" hint="Choose a file to replace it, or leave blank to keep the current one">
              {attraction.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={attraction.heroImageUrl} alt="" className="mb-2 h-20 w-32 object-cover rounded-lg border border-gray-200" />
              ) : null}
              <input type="hidden" name="existingHeroImageUrl" value={attraction.heroImageUrl} />
              <input type="file" name="heroImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
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
      {/* Highlights                                                    */}
      {/* ------------------------------------------------------------- */}
      <SectionCard title="Highlights" hint="One per line">
        <form action={boundReplaceHighlights} className="space-y-3">
          <textarea name="highlights" defaultValue={attraction.highlights.map((h) => h.text).join('\n')} rows={5} className="input" />
          <button type="submit" className="btn-secondary">
            Save highlights
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Ticket options — price/logistics AND product-specific details */}
      {/* (meeting point, included/not included, before you go) live    */}
      {/* here per-ticket, not on the attraction, since they differ per */}
      {/* product. Not shown on the public page — only surfaced after   */}
      {/* booking, on the confirmation page and in the confirmation     */}
      {/* email. This is also exactly what a future Rezdy sync would    */}
      {/* populate automatically instead of typing it in by hand.       */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="tickets" title="Tickets & tours" hint="Prices, durations, and each product's own meeting point / inclusions / before-you-go info">
        {searchParams?.ticketError ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{searchParams.ticketError}</p>
        ) : null}
        <div className="space-y-4 mb-6">
          {attraction.ticketOptions.map((ticket) => {
            const ticketIncluded = ticket.includedItems.filter((i) => i.included).map((i) => i.text);
            const ticketNotIncluded = ticket.includedItems.filter((i) => !i.included).map((i) => i.text);
            const ticketFormId = `ticket-form-${ticket.id}`;
            return (
              // Wrapping <div>, not <form> — the delete button below needs
              // its own <form> (a different server action), and HTML
              // doesn't allow a <form> inside a <form> (browsers silently
              // break out of it, which caused a hydration mismatch since
              // React's server-rendered tree didn't match what the browser
              // actually produced). The Save button uses the HTML5
              // form="..." attribute to submit the edit form despite living
              // outside it, so the layout is unchanged.
              <div key={ticket.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <form id={ticketFormId} action={updateTicketOption.bind(null, ticket.id, attraction.slug)} encType="multipart/form-data" className="space-y-3">
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

                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <p className="text-[11px] font-medium text-gray-500">
                    Product-specific details — shown only after booking (confirmation page &amp; email), never on the public page
                  </p>
                  <Field label="Meeting Point Address" hint="Start typing a place or address — pick a suggestion to fill it in.">
                    <AddressAutocompleteInput
                      name="meetingPointAddress"
                      defaultValue={ticket.meetingPointAddress}
                      placeholder="e.g. Park Güell, Barcelona"
                    />
                  </Field>
                  <Field label="Meeting Point Instruction" hint="Directions or details beyond the address, e.g. 'Look for the blue umbrella'">
                    <textarea
                      name="meetingPoint"
                      defaultValue={ticket.meetingPoint}
                      rows={2}
                      placeholder="e.g. Look for the blue umbrella at the main entrance"
                      className="input"
                    />
                  </Field>
                  <Field label="Meeting point image" hint="Shown next to the meeting point on the confirmation page & email">
                    {ticket.meetingPointImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ticket.meetingPointImage} alt="" className="mb-2 h-20 w-32 object-cover rounded-lg border border-gray-200" />
                    ) : null}
                    <input type="hidden" name="existingMeetingPointImage" value={ticket.meetingPointImage} />
                    <input type="file" name="meetingPointImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {ticket.meetingPointImage ? 'Choose a file to replace the current image, or leave blank to keep it.' : 'JPG, PNG, WEBP, or GIF — up to 5MB.'}
                    </p>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="What's included" hint="One per line">
                      <textarea name="included" defaultValue={ticketIncluded.join('\n')} rows={3} className="input" />
                    </Field>
                    <Field label="Not included" hint="One per line">
                      <textarea name="notIncluded" defaultValue={ticketNotIncluded.join('\n')} rows={3} className="input" />
                    </Field>
                  </div>
                  <Field label="Before you go" hint="One per line">
                    <textarea name="beforeYouGo" defaultValue={ticket.infoItems.map((i) => i.text).join('\n')} rows={3} className="input" />
                  </Field>
                </div>
                </form>

                <div className="flex items-center justify-between pt-1">
                  <button type="submit" form={ticketFormId} className="btn-secondary">
                    Save
                  </button>
                  <form action={deleteTicketOption.bind(null, ticket.id, attraction.slug)}>
                    <DeleteButton confirmText={`Delete ticket option "${ticket.name}"?`} />
                  </form>
                </div>
              </div>
            );
          })}

          {attraction.ticketOptions.length === 0 ? <p className="text-sm text-gray-400">No ticket options yet.</p> : null}
        </div>

        <p className="text-xs font-medium text-gray-500 mb-2">Add a new ticket option</p>
        <form action={boundAddTicket} encType="multipart/form-data" className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
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

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <p className="text-[11px] font-medium text-gray-500">
              Product-specific details — shown only after booking (confirmation page &amp; email), never on the public page
            </p>
            <Field label="Meeting Point Address" hint="Start typing a place or address — pick a suggestion to fill it in.">
              <AddressAutocompleteInput name="meetingPointAddress" placeholder="e.g. Park Güell, Barcelona" />
            </Field>
            <Field label="Meeting Point Instruction" hint="Directions or details beyond the address, e.g. 'Look for the blue umbrella'">
              <textarea name="meetingPoint" rows={2} placeholder="e.g. Look for the blue umbrella at the main entrance" className="input" />
            </Field>
            <Field label="Meeting point image" hint="Shown next to the meeting point on the confirmation page & email">
              <input type="file" name="meetingPointImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
              <p className="text-[11px] text-gray-400 mt-1">JPG, PNG, WEBP, or GIF — up to 5MB. Optional.</p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="What's included" hint="One per line">
                <textarea name="included" rows={3} className="input" />
              </Field>
              <Field label="Not included" hint="One per line">
                <textarea name="notIncluded" rows={3} className="input" />
              </Field>
            </div>
            <Field label="Before you go" hint="One per line">
              <textarea name="beforeYouGo" rows={3} className="input" />
            </Field>
          </div>

          <button type="submit" className="btn-secondary">
            + Add ticket option
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Images                                                        */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="images" title="Gallery photos" hint="Real photos only">
        {searchParams?.error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{searchParams.error}</p>
        ) : null}
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

        <form action={boundAddImage} encType="multipart/form-data" className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/gif" required className="input" />
            <input name="altText" placeholder="Alt text (for accessibility & SEO)" className="input" />
          </div>
          <button type="submit" className="btn-secondary">
            + Add photo
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* Quick facts strip (dark bar below the hero)                   */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="quick-facts" title="Quick facts strip" hint="Up to 4 shown in the dark bar below the hero, e.g. “Built over 140 years / Still under construction”">
        <div className="space-y-2 mb-4">
          {attraction.quickFacts.map((fact) => (
            <div key={fact.id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
              <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                <p className="text-sm text-gray-700 truncate">{fact.title}</p>
                <p className="text-xs text-gray-400 truncate">{fact.subtitle}</p>
              </div>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{fact.icon}</span>
              <form action={deleteQuickFact.bind(null, fact.id, attraction.slug)}>
                <DeleteButton />
              </form>
            </div>
          ))}
          {attraction.quickFacts.length === 0 ? <p className="text-sm text-gray-400">No quick facts yet — the strip is hidden until you add some.</p> : null}
        </div>

        <form action={boundAddQuickFact} className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="title" placeholder="Title, e.g. Built over 140 years" required className="input" />
            <input name="subtitle" placeholder="Subtitle, e.g. Still under construction" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select name="icon" defaultValue="landmark" className="input">
              <option value="landmark">Landmark / building</option>
              <option value="column">Column</option>
              <option value="people">People</option>
              <option value="camera">Camera</option>
            </select>
            <input name="sortOrder" type="number" placeholder="Sort order" className="input" />
          </div>
          <button type="submit" className="btn-secondary">
            + Add quick fact
          </button>
        </form>
      </SectionCard>

      {/* ------------------------------------------------------------- */}
      {/* FAQs                                                          */}
      {/* ------------------------------------------------------------- */}
      <SectionCard id="faqs" title="FAQs">
        <div className="space-y-3 mb-4">
          {attraction.faqs.map((faq) => {
            const faqFormId = `faq-form-${faq.id}`;
            return (
              // Wrapping <div>, not <form> — see the same note on the
              // ticket options above: a <form> can't contain another
              // <form>, so the delete button's form has to be a sibling,
              // with the Save button using form="..." to still submit the
              // edit form from outside it.
              <div key={faq.id} className="border border-gray-200 rounded-xl p-4 space-y-2">
                <form id={faqFormId} action={updateFaq.bind(null, faq.id, attraction.slug)} className="space-y-2">
                  <input name="question" defaultValue={faq.question} placeholder="Question" className="input" />
                  <textarea name="answer" defaultValue={faq.answer} rows={2} placeholder="Answer" className="input" />
                </form>
                <div className="flex items-center justify-between pt-1">
                  <button type="submit" form={faqFormId} className="btn-secondary">
                    Save
                  </button>
                  <form action={deleteFaq.bind(null, faq.id, attraction.slug)}>
                    <DeleteButton />
                  </form>
                </div>
              </div>
            );
          })}
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
