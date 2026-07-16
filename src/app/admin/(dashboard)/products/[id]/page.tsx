import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { SavedToast } from '@/components/admin/SavedToast';
import { ProductForm, type ProductFormValues } from '@/components/products/ProductForm';
import {
  updateAdminProductAction,
  deleteAdminProductAction,
  addAdminProductImageAction,
  deleteAdminProductImageAction,
  approveProductAction,
  rejectProductAction,
  disableProductAction,
  republishProductAction
} from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  category: 'Select a category.',
  missing: 'Product title is required.'
};

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700 border-amber-100',
  published: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  disabled: 'bg-gray-100 text-gray-500 border-gray-200'
};

export default async function EditAdminProductPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin');

  const product = await prisma.ticketOption.findUnique({
    where: { id: params.id },
    include: {
      includedItems: { orderBy: { sortOrder: 'asc' } },
      infoItems: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      attraction: { select: { id: true, name: true } },
      supplier: { select: { id: true, companyName: true, email: true } }
    }
  });
  if (!product) notFound();

  const categories = await prisma.attraction.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } });

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
    meetingPoint: product.meetingPoint,
    meetingPointImage: product.meetingPointImage,
    cancellationPolicy: product.cancellationPolicy,
    maxGroupSize: product.maxGroupSize,
    availableDays: product.availableDays,
    timeSlots: product.timeSlots,
    included: product.includedItems.filter((i) => i.included).map((i) => i.text).join('\n'),
    notIncluded: product.includedItems.filter((i) => !i.included).map((i) => i.text).join('\n'),
    beforeYouGo: product.infoItems.map((i) => i.text).join('\n'),
    sortOrder: product.sortOrder
  };

  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] ?? decodeURIComponent(searchParams.error) : undefined;

  return (
    <div className="max-w-2xl">
      <SavedToast />
      <Link href="/admin/products" className="text-sm text-blue-600 mb-4 inline-block">
        &larr; Back to products
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[product.status]}`}>
          {product.status.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {product.supplier ? `Supplier: ${product.supplier.companyName} (${product.supplier.email})` : 'House product'}
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4">
        <p className="text-sm font-semibold">Moderation</p>
        {product.status === 'rejected' && product.rejectionReason ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">Rejected: {product.rejectionReason}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {product.status === 'pending_review' ? (
            <>
              <form action={approveProductAction.bind(null, product.id)}>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  Approve
                </button>
              </form>
              <details>
                <summary className="text-sm text-red-600 font-medium cursor-pointer select-none px-1 py-2">Reject</summary>
                <form action={rejectProductAction.bind(null, product.id)} className="mt-2 space-y-2">
                  <textarea name="rejectionReason" rows={2} placeholder="Reason shown to the supplier" className="input text-sm" />
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                    Reject product
                  </button>
                </form>
              </details>
            </>
          ) : null}
          {product.status === 'published' ? (
            <form action={disableProductAction.bind(null, product.id)}>
              <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg">
                Disable
              </button>
            </form>
          ) : null}
          {product.status === 'disabled' || product.status === 'rejected' ? (
            <form action={republishProductAction.bind(null, product.id)}>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                Publish
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 mb-6">
        <p className="text-sm font-semibold">Photos</p>
        {product.images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {product.images.map((img) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText} className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                <form action={deleteAdminProductImageAction.bind(null, img.id, product.id)} className="absolute top-1 right-1">
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
        <form action={addAdminProductImageAction.bind(null, product.id)} encType="multipart/form-data" className="flex items-center gap-3">
          <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap">
            Add photo
          </button>
        </form>
      </div>

      <ProductForm
        action={updateAdminProductAction.bind(null, product.id)}
        submitLabel="Save changes"
        categories={categories}
        values={values}
        errorMessage={errorMessage}
      />

      <div className="mt-6 pt-6 border-t border-gray-200">
        <form action={deleteAdminProductAction.bind(null, product.id)}>
          <button type="submit" className="text-sm text-red-600 font-medium">
            Delete this product
          </button>
        </form>
      </div>
    </div>
  );
}
