import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ProductForm } from '@/components/products/ProductForm';
import { createAdminProductAction } from '../actions';

const ERROR_MESSAGES: Record<string, string> = {
  category: 'Select a category.',
  missing: 'Product title is required.'
};

export default async function NewAdminProductPage({ searchParams }: { searchParams: { error?: string; attraction?: string } }) {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin');

  const categories = await prisma.attraction.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } });
  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] ?? decodeURIComponent(searchParams.error) : undefined;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/products" className="text-sm text-blue-600 mb-4 inline-block">
        &larr; Back to products
      </Link>
      <h1 className="text-xl font-semibold mb-1">Add a house product</h1>
      <p className="text-sm text-gray-500 mb-6">Published immediately — this is your own product, not a supplier submission.</p>

      <ProductForm
        action={createAdminProductAction}
        submitLabel="Publish product"
        categories={categories}
        errorMessage={errorMessage}
        showInitialPhotoUpload
      />
    </div>
  );
}
