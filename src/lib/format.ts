export function formatPrice(amount: number, currency: string = 'EUR', locale: string = 'en-GB'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date | string, locale: string = 'en-GB'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

// Short form used on the booking confirmation page, e.g. "Sat, 15 Aug".
export function formatDateShort(date: Date | string, locale: string = 'en-GB'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

// Converts a 24h "HH:MM" time slot (how they're stored) into 12h display
// form, e.g. "09:00" -> "9:00 AM".
export function formatTime12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  const hour24 = Number(hStr);
  const minute = Number(mStr ?? 0);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return time;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}
