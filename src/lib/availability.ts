// Demo availability generator. There is no real inventory system connected
// yet — this produces a plausible, deterministic pattern (some days sold
// out, three time slots per day with small price variance) so the booking
// flow is fully clickable end to end.
//
// TODO: replace with a real Rezdy availability call once the API key and
// product mapping are set up (see .env.example). Keep the return shape the
// same (TimeSlot[]) so the calendar/modal UI doesn't need to change.

export type TimeSlot = {
  time: string; // "09:00"
  price: number; // price per adult for this slot
  spotsLeft: number;
  popular?: boolean;
};

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

export function isDateAvailable(date: Date): boolean {
  if (isPastDate(date)) return false;
  // Demo pattern: every 7th day of the month is sold out.
  return date.getDate() % 7 !== 0;
}

const SLOT_TIMES = ['09:00', '12:30', '16:00'];

export function getTimeSlotsForDate(date: Date, basePrice: number): TimeSlot[] {
  const dayOfMonth = date.getDate();
  return SLOT_TIMES.map((time, i) => {
    const priceAdjust = i === 1 ? 1.1 : i === 2 ? 1.05 : 1; // midday slot priced slightly higher
    const spotsLeft = ((dayOfMonth * (i + 3)) % 9) + 1; // deterministic, 1-9
    return {
      time,
      price: Math.round(basePrice * priceAdjust),
      spotsLeft,
      popular: i === 1
    };
  });
}

// Builds a 7-column calendar grid (Sun-Sat) for the given month, padded with
// null for leading/trailing empty cells.
export function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
