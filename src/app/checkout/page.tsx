import { getCurrentUser } from '@/lib/customerAuth';
import CheckoutForm from './CheckoutForm';

// Server wrapper — reads the signed-in customer (if any) so CheckoutForm
// can prefill their details and link the new order to their account.
export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const initialUser = user
    ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone }
    : null;

  return <CheckoutForm initialUser={initialUser} />;
}
