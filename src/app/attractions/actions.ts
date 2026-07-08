// This file is superseded by src/app/checkout/actions.ts.
//
// Checkout moved from "book one ticket instantly from the attraction page"
// to a cart-based flow: attraction pages add a ticket selection to the
// cart (client-side, see src/components/cart/CartProvider.tsx), and
// /checkout collects guest details once for the whole cart and calls
// createOrder() in src/app/checkout/actions.ts, which can create several
// Bookings under one Order. Nothing in the app imports from this file
// anymore — it's kept only as a pointer for anyone who remembers the old
// single-booking action.
export {};
