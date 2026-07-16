import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { WizardSteps } from '@/components/products/wizard/WizardSteps';
import { Step1BasicInfo, EMPTY_STEP1_VALUES } from '@/components/products/wizard/Step1BasicInfo';

const ERROR_MESSAGES: Record<string, string> = {
  category: 'Select one of your assigned categories.',
  missing: 'Product title is required.'
};

// Entry point for creating a brand-new product — always Step 1, since a
// product doesn't exist yet to attach Step 2/3 data to. Saving Step 1 (via
// either button) creates it immediately with status "draft" and, from then
// on, the wizard continues at /supplier/products/[id].
export default async function NewSupplierProductPage({ searchParams }: { searchParams: { error?: string } }) {
  const supplier = await getCurrentSupplier();
  if (!supplier) redirect('/supplier/login');

  const categoryLinks = await prisma.supplierCategory.findMany({
    where: { supplierId: supplier.id },
    include: { attraction: { select: { id: true, name: true } } }
  });
  const categories = categoryLinks.map((c) => c.attraction);

  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] ?? decodeURIComponent(searchParams.error) : undefined;

  return (
    <div className="max-w-4xl">
      <Link href="/supplier/products" className="text-sm text-blue-600 mb-4 inline-block">
        &larr; Back to products
      </Link>
      <h1 className="text-xl font-semibold mb-1">Add a new product</h1>
      <p className="text-sm text-gray-500 mb-6">
        Your progress is saved automatically as you go, so you can leave and pick up where you left off. It&rsquo;s reviewed by our
        team once you publish.
      </p>

      {categories.length === 0 ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-sm text-amber-800">
          You don&rsquo;t have any assigned categories yet — contact the Vacay in Barcelona team.
        </div>
      ) : (
        <>
          <WizardSteps productId={null} current={1} />
          <Step1BasicInfo productId={null} categories={categories} values={EMPTY_STEP1_VALUES} photos={[]} errorMessage={errorMessage} />
        </>
      )}
    </div>
  );
}
