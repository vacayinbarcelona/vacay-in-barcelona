'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { formatDate, formatPrice } from '@/lib/format';

export default function CartPage() {
  const { items, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mb-6">Add tickets or tours from any attraction page to get started.</p>
        <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full inline-block">
          Browse attractions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-xl font-semibold mb-6">Your cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemTotal = item.adults * item.pricePerAdult + item.children * item.pricePerChild;
            const guestsSummary = `${item.adults} adult${item.adults !== 1 ? 's' : ''}${
              item.children > 0 ? `, ${item.children} child${item.children !== 1 ? 'ren' : ''}` : ''
            }`;
            return (
              <div key={item.id} className="flex gap-4 border border-gray-200 rounded-xl p-4">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover" sizes="96px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">{item.attractionName}</p>
                  <p className="text-sm font-medium">{item.ticketOptionName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(item.date)} at {item.timeSlot} · {guestsSummary}
                    {item.language ? ` · ${item.language}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">
                      Remove
                    </button>
                    <p className="text-sm font-semibold">{formatPrice(itemTotal, item.currency)}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <Link href="/" className="inline-block text-xs text-blue-600 font-medium">
            &larr; Add more tickets
          </Link>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 h-fit">
          <h2 className="text-sm font-semibold mb-4">Order summary</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{item.ticketOptionName}</span>
                <span className="flex-shrink-0">{formatPrice(item.adults * item.pricePerAdult + item.children * item.pricePerChild, item.currency)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-5">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">{formatPrice(subtotal, items[0]?.currency ?? 'EUR')}</span>
          </div>
          <Link
            href="/checkout"
            className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-full"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
