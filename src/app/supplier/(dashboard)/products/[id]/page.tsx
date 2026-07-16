import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { SavedToast } from '@/components/admin/SavedToast';
import { WizardSteps } from '@/components/products/wizard/WizardSteps';
import { Step1BasicInfo, type Step1Values } from '@/components/products/wizard/Step1BasicInfo';
import { Step2MeetingPoint, type Step2Values } from '@/components/products/wizard/Step2MeetingPoint';
import { Step3Availability } from '@/components/products/wizard/Step3Availability';
import { dbSchedulesToDraft } from '@/lib/availabilitySchedule';
import { deleteSupplierProductAction } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  category: 'Select one of your assigned categories.',
  missing: 'Product title is required.',
  'missing-contact': 'Supplier email address and contact number are both required.',
  'invalid-contact-email': 'Please enter a valid supplier email address.'
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-blue-50 text-blue-600 border-blue-100',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-100',
  published: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  disabled: 'bg-gray-100 text-gray-500 border-gray-200'
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  published: 'Published',
  rejected: 'Rejected',
  disabled: 'Disabled'
};

function toStep(raw: string | undefined): 1 | 2 | 3 {
  if (raw === '2') return 2;
  if (raw === '3') return 3;
  return 1;
}

// The 3-step supplier product wizard (see src/components/products/wizard/)
// for an already-existing product — used both to finish a not-yet-published
// draft and to edit a live/pending/rejected/disabled one. All 3 steps stay
// reachable at any time via the tab bar, since every save is already
// persisted (see actions.ts) — there's nothing that requires visiting the
// steps strictly in order except the very first Step 1 save that creates
// the product in the first place (see /supplier/products/new).
export default async function SupplierProductWizardPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string; step?: string };
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

  const step = toStep(searchParams?.step);
  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] ?? decodeURIComponent(searchParams.error) : undefined;

  const step1Values: Step1Values = {
    attractionId: product.attractionId,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    durationLabel: product.durationLabel,
    freeCancellation: product.freeCancellation,
    mobileTicket: product.mobileTicket,
    instantConfirmation: product.instantConfirmation,
    cancellationPolicy: product.cancellationPolicy,
    groupType: product.groupType,
    included: product.includedItems.filter((i) => i.included).map((i) => i.text).join('\n'),
    notIncluded: product.includedItems.filter((i) => !i.included).map((i) => i.text).join('\n'),
    beforeYouGo: product.infoItems.map((i) => i.text).join('\n')
  };

  const step2Values: Step2Values = {
    meetingPointAddress: product.meetingPointAddress,
    meetingPoint: product.meetingPoint,
    meetingPointImage: product.meetingPointImage,
    supplierContactName: product.supplierContactName,
    supplierContactEmail: product.supplierContactEmail,
    supplierContactPhone: product.supplierContactPhone
  };

  return (
    <div className="max-w-4xl">
      <SavedToast />
      <Link href="/supplier/products" className="text-sm text-blue-600 mb-4 inline-block">
        &larr; Back to products
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold">{product.name || 'Untitled product'}</h1>
        <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[product.status] ?? STATUS_STYLES.draft}`}>
          {STATUS_LABELS[product.status] ?? product.status}
        </span>
      </div>
      {product.status === 'rejected' && product.rejectionReason ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4 mt-3">
          Rejected: {product.rejectionReason}
        </p>
      ) : null}
      <p className="text-sm text-gray-500 mb-6">
        {product.status === 'draft'
          ? "Your progress is saved automatically as you go — click Publish Product on the last step when you're ready to submit it for review."
          : 'Saving progress here does not resubmit this product for review — only Publish Product does.'}
      </p>

      <WizardSteps productId={product.id} current={step} />

      {step === 1 ? (
        <Step1BasicInfo productId={product.id} categories={categories} values={step1Values} photos={product.images} errorMessage={errorMessage} />
      ) : step === 2 ? (
        <Step2MeetingPoint productId={product.id} values={step2Values} errorMessage={errorMessage} />
      ) : (
        <Step3Availability productId={product.id} availabilitySchedules={dbSchedulesToDraft(product.languageSchedules)} errorMessage={errorMessage} />
      )}

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
