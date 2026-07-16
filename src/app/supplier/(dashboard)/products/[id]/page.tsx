import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { SavedToast } from '@/components/admin/SavedToast';
import { ProductForm, type ProductFormValues } from '@/components/products/ProductForm';
import { dbSchedulesToDraft } from '@/lib/availabilitySchedule';
import {
  updateSupplierProductAction,
  deleteSupplierProductAction,
  addSupplierProductImageAction,
  deleteSupplierProductImageAction
} from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  category: 'Select one of your assigned categories.',
  missing: 'Product title is required.',
  'missing-contact': 'Supplier email address and contact number are required.',
  'invalid-contact-email': 'Please enter a valid supplier email address.'
};

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700 border-amber-100',
  published: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  disabled: 'bg-gray-100 text-gray-500 border-gray-200'
};

export default async function EditSupplierProductPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supplier = await getCurrentSupplier();
  if (!supplier) redirect('/supplier/login');

  const product = await prisma.ticketOption.findUnique({
    where: { id: params.id },
    include: {
      includedItems: { orderBy: { sortOrder: 'asc' } },
      infoItems: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      attraction: { select: { id: true, name: true } },
      languageSchedules: {
        orderBy: { sortOrder: 'asc' },
        include: { slots: { orderBy: { sortOrder: 'asc' }, include: { ticketTypes: { orderBy: { sortOrder: 'asc' } } } } }
      }
    }
  });
  if (!product || product.supplierId !== supplier.id) notFound();

  const categoryLinks = await prisma.supplierCategory.findMany({
    where: { supplierId: supplier.id },
    include: { attraction: { select: { id: true, name: true } } }
  });
  const categories = categoryLinks.map((c) => c.attraction);
  // Defensive: keep the product's current category selectable even if
  // access was later revoked, so the form doesn't silently drop it.
  if (!categories.some((c) => c.id === product.attractionId)) {
    categories.push(product.attraction);
  }

  const values: ProductFormValues = {
    attractionId: product.attractionId,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    durationLabel: product.durationLabel,
    freeCancellation: product.freeCancellation,
    mobileTicket: product.mobileTicket,
    instantConfirmation: product.instantConfirmation,
    languages: product.languages,
    groupType: product.groupType,
    badge: product.badge,
    meetingPointAddress: product.meetingPointAddress,
    meetingPoint: product.meetingPoint,
    meetingPointImage: product.meetingPointImage,
    supplierContactEmail: product.supplierContactEmail,
    supplierContactPhone: product.supplierContactPhone,
    cancellationPolicy: product.cancellationPolicy,
    maxGroupSize: product.maxGroupSize,
    availableDays: product.availableDays,
    timeSlots: product.timeSlots,
    availabilitySchedules: dbSchedulesToDraft(product.languageSchedules),
    included: product.includedItems.filter((i) => i.included).map((i) => i.text).join('\n'),
    notIncluded: product.includedItems.filter((i) => !i.included).map((i) => i.text).join('\n'),
    beforeYouGo: product.infoItems.map((i) => i.text).join('\n'),
    sortOrder: product.sortOrder
  };

  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] ?? decodeURIComponent(searchParams.error) : undefined;

  return (
    <div className="max-w-2xl">
      <SavedToast />
      <Link href="/supplier/products" className="text-sm text-blue-600 mb-4 inline-block">
        &larr; Back to products
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[product.status]}`}>
          {product.status.replace('_', ' ')}
        </span>
      </div>
      {product.status === 'rejected' && product.rejectionReason ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4 mt-3">
          Rejected: {product.rejectionReason}
        </p>
      ) : null}
      <p className="text-sm text-gray-500 mb-6">Saving changes sends this product back for review.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 mb-6">
        <p className="text-sm font-semibold">Photos</p>
        {product.images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {product.images.map((img) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText} className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                <form action={deleteSupplierProductImageAction.bind(null, img.id, product.id)} className="absolute top-1 right-1">
                  <button type="submit" className="bg-white/90 text-red-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No photos yet.</p>
        )}
        <form action={addSupplierProductImageAction.bind(null, product.id)} encType="multipart/form-data" className="flex items-center gap-3">
          <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap">
            Add photo
          </button>
        </form>
      </div>

      <ProductForm
        action={updateSupplierProductAction.bind(null, product.id)}
        submitLabel="Save changes"
        categories={categories}
        values={values}
        errorMessage={errorMessage}
        requireContactInfo
        showBadgeAndSortOrder={false}
      />

      <div className="mt-6 pt-6 border-t border-gray-200">
        <form action={deleteSupplierProductAction.bind(null, product.id)}>
          <button type="submit" className="text-sm text-red-600 font-medium">
            Delete this product
          </button>
        </form>
      </div>
    </div>
  );
}
