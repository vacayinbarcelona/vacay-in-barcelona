import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { ProductForm } from '@/components/products/ProductForm';
import { createSupplierProductAction } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  category: "Select one of your assigned categories.",
  missing: 'Product title is required.',
  'missing-contact': 'Supplier email address and contact number are required.',
  'invalid-contact-email': 'Please enter a valid supplier email address.'
};

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
    <div className="max-w-2xl">
      <Link href="/supplier/products" className="text-sm text-blue-600 mb-4 inline-block">
        &larr; Back to products
      </Link>
      <h1 className="text-xl font-semibold mb-1">Add a new product</h1>
      <p className="text-sm text-gray-500 mb-6">This will be reviewed by our team before it appears on the site.</p>

      {categories.length === 0 ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-sm text-amber-800">
          You don&rsquo;t have any assigned categories yet — contact the Vacay in Barcelona team.
        </div>
      ) : (
        <ProductForm
          action={createSupplierProductAction}
          submitLabel="Submit for review"
          categories={categories}
          errorMessage={errorMessage}
          showInitialPhotoUpload
          requireContactInfo
          showBadgeAndSortOrder={false}
        />
      )}
    </div>
  );
}
