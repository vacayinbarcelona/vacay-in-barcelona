// Shared constants, types, and (de)serialization for the Availability
// section's language -> date range -> weekday -> time slot -> ticket type
// editor (see AvailabilityScheduleEditor.tsx). Used by both the client
// component and the admin/supplier server actions that persist it, so the
// shape only has to be defined once.
//
// The editor keeps its whole tree in React state and, on submit, writes it
// into a single hidden `availabilityJson` form field as JSON — a plain-form-
// field encoding for an arbitrarily-deep, arbitrarily-repeating structure
// like this would be far more fragile than just serializing the tree.

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const AGE_UNITS = ['years', 'months'] as const;
export type AgeUnit = (typeof AGE_UNITS)[number];

// Major world languages — not exhaustive, but covers the common cases a
// tour/attraction would actually offer. Alphabetical so it's easy to scan.
export const LANGUAGES = [
  'Arabic',
  'Chinese',
  'Dutch',
  'English',
  'French',
  'German',
  'Hindi',
  'Italian',
  'Japanese',
  'Korean',
  'Polish',
  'Portuguese',
  'Russian',
  'Spanish',
  'Swedish',
  'Turkish'
];

// Every 15-minute increment across a full day, "00:00".."23:45" — the time
// picker for a slot's start time.
export const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

// Default age ranges for the 4 common ticket type suggestions — shown as
// quick-add buttons in the editor; suppliers can still fully customize or
// add entirely different categories.
export const TICKET_TYPE_PRESETS: { name: string; ageFromValue: number; ageFromUnit: AgeUnit; ageToValue: number; ageToUnit: AgeUnit }[] = [
  { name: 'Adult', ageFromValue: 18, ageFromUnit: 'years', ageToValue: 64, ageToUnit: 'years' },
  { name: 'Child', ageFromValue: 4, ageFromUnit: 'years', ageToValue: 17, ageToUnit: 'years' },
  { name: 'Infant', ageFromValue: 0, ageFromUnit: 'months', ageToValue: 3, ageToUnit: 'years' },
  { name: 'Senior', ageFromValue: 65, ageFromUnit: 'years', ageToValue: 99, ageToUnit: 'years' }
];

export type TicketTypeDraft = {
  id: string;
  name: string;
  ageFromValue: number;
  ageFromUnit: AgeUnit;
  ageToValue: number;
  ageToUnit: AgeUnit;
  price: number;
  availability: number;
};

export type SlotDraft = {
  id: string;
  weekday: Weekday;
  time: string;
  ticketTypes: TicketTypeDraft[];
};

export type LanguageScheduleDraft = {
  id: string;
  language: string;
  dateFrom: string; // "YYYY-MM-DD"
  dateTo: string;
  slots: SlotDraft[];
};

let idCounter = 0;
export function newDraftId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

// Shape of a TicketOption's languageSchedules once loaded from Prisma with
// the full nested include (slots -> ticketTypes) — used when populating the
// editor on an edit page.
export type DbLanguageSchedule = {
  id: string;
  language: string;
  dateFrom: Date;
  dateTo: Date;
  slots: {
    id: string;
    weekday: string;
    time: string;
    ticketTypes: {
      id: string;
      name: string;
      ageFromValue: number;
      ageFromUnit: string;
      ageToValue: number;
      ageToUnit: string;
      price: number;
      availability: number;
    }[];
  }[];
};

export function dbSchedulesToDraft(schedules: DbLanguageSchedule[]): LanguageScheduleDraft[] {
  return schedules.map((s) => ({
    id: s.id,
    language: s.language,
    dateFrom: s.dateFrom.toISOString().slice(0, 10),
    dateTo: s.dateTo.toISOString().slice(0, 10),
    slots: s.slots.map((sl) => ({
      id: sl.id,
      weekday: (WEEKDAYS.includes(sl.weekday as Weekday) ? sl.weekday : 'Mon') as Weekday,
      time: sl.time,
      ticketTypes: sl.ticketTypes.map((t) => ({
        id: t.id,
        name: t.name,
        ageFromValue: t.ageFromValue,
        ageFromUnit: (AGE_UNITS.includes(t.ageFromUnit as AgeUnit) ? t.ageFromUnit : 'years') as AgeUnit,
        ageToValue: t.ageToValue,
        ageToUnit: (AGE_UNITS.includes(t.ageToUnit as AgeUnit) ? t.ageToUnit : 'years') as AgeUnit,
        price: t.price,
        availability: t.availability
      }))
    }))
  }));
}

// Builds the nested Prisma `create` input for TicketOption.languageSchedules
// from a validated draft tree — used by both create and update (an update
// always deletes existing schedules first, then recreates from scratch,
// same convention as includedItems/infoItems elsewhere in this codebase).
export function draftToPrismaCreate(schedules: LanguageScheduleDraft[]) {
  return schedules.map((s, si) => ({
    language: s.language,
    dateFrom: new Date(s.dateFrom),
    dateTo: new Date(s.dateTo),
    sortOrder: si,
    slots: {
      create: s.slots.map((sl, sli) => ({
        weekday: sl.weekday,
        time: sl.time,
        sortOrder: sli,
        ticketTypes: {
          create: sl.ticketTypes.map((t, ti) => ({
            name: t.name,
            ageFromValue: t.ageFromValue,
            ageFromUnit: t.ageFromUnit,
            ageToValue: t.ageToValue,
            ageToUnit: t.ageToUnit,
            price: t.price,
            availability: t.availability,
            sortOrder: ti
          }))
        }
      }))
    }
  }));
}

// Safe JSON parse + defensive shape coercion — used server-side, where the
// payload came from a form submission and shouldn't be trusted blindly even
// though it's an internal admin/supplier tool, not public input.
export function parseAvailabilityJson(raw: string): LanguageScheduleDraft[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const schedules: LanguageScheduleDraft[] = [];
  for (const s of parsed) {
    if (!s || typeof s !== 'object') continue;
    const schedule = s as Record<string, unknown>;
    const language = typeof schedule.language === 'string' ? schedule.language.trim() : '';
    const dateFrom = typeof schedule.dateFrom === 'string' ? schedule.dateFrom : '';
    const dateTo = typeof schedule.dateTo === 'string' ? schedule.dateTo : '';
    const rawSlots = Array.isArray(schedule.slots) ? schedule.slots : [];

    const slots: SlotDraft[] = [];
    for (const sl of rawSlots) {
      if (!sl || typeof sl !== 'object') continue;
      const slot = sl as Record<string, unknown>;
      const weekday = WEEKDAYS.includes(slot.weekday as Weekday) ? (slot.weekday as Weekday) : null;
      const time = typeof slot.time === 'string' ? slot.time : '';
      const rawTicketTypes = Array.isArray(slot.ticketTypes) ? slot.ticketTypes : [];
      if (!weekday || !time) continue;

      const ticketTypes: TicketTypeDraft[] = [];
      for (const tt of rawTicketTypes) {
        if (!tt || typeof tt !== 'object') continue;
        const t = tt as Record<string, unknown>;
        const name = typeof t.name === 'string' ? t.name.trim() : '';
        if (!name) continue;
        ticketTypes.push({
          id: typeof t.id === 'string' ? t.id : newDraftId('tt'),
          name,
          ageFromValue: Number.isFinite(Number(t.ageFromValue)) ? Math.max(0, Math.round(Number(t.ageFromValue))) : 0,
          ageFromUnit: AGE_UNITS.includes(t.ageFromUnit as AgeUnit) ? (t.ageFromUnit as AgeUnit) : 'years',
          ageToValue: Number.isFinite(Number(t.ageToValue)) ? Math.max(0, Math.round(Number(t.ageToValue))) : 0,
          ageToUnit: AGE_UNITS.includes(t.ageToUnit as AgeUnit) ? (t.ageToUnit as AgeUnit) : 'years',
          price: Number.isFinite(Number(t.price)) ? Math.max(0, Number(t.price)) : 0,
          availability: Number.isFinite(Number(t.availability)) ? Math.max(0, Math.round(Number(t.availability))) : 0
        });
      }

      slots.push({ id: typeof slot.id === 'string' ? slot.id : newDraftId('slot'), weekday, time, ticketTypes });
    }

    if (!language || !dateFrom || !dateTo) continue;
    schedules.push({ id: typeof schedule.id === 'string' ? schedule.id : newDraftId('lang'), language, dateFrom, dateTo, slots });
  }

  return schedules;
}

// Validates a fully-parsed draft tree, returning a human-readable error for
// the first problem found (or null if everything required is filled in).
// An empty `schedules` array is valid — Availability is optional overall;
// once a supplier starts a language block, though, it has to be complete.
export function validateAvailabilitySchedules(schedules: LanguageScheduleDraft[]): string | null {
  for (const schedule of schedules) {
    if (!schedule.language) return 'Select a language for every availability block, or remove the empty one.';
    if (!schedule.dateFrom || !schedule.dateTo) return `Set both a From and To date for ${schedule.language}.`;
    if (schedule.dateFrom > schedule.dateTo) return `${schedule.language}'s To date must be on or after its From date.`;
    if (schedule.slots.length === 0) return `Select at least one day and time slot for ${schedule.language}.`;
    for (const slot of schedule.slots) {
      if (!slot.time) return `Set a time for every slot on ${slot.weekday} (${schedule.language}).`;
      if (slot.ticketTypes.length === 0) {
        return `Add at least one ticket type to the ${slot.time} slot on ${slot.weekday} (${schedule.language}), or remove that time slot.`;
      }
      for (const t of slot.ticketTypes) {
        if (!t.name.trim()) return `Every ticket type needs a name (${slot.weekday} ${slot.time}, ${schedule.language}).`;
        if (t.price < 0) return `${t.name}'s price can't be negative (${slot.weekday} ${slot.time}, ${schedule.language}).`;
        if (t.availability < 0) return `${t.name}'s availability can't be negative (${slot.weekday} ${slot.time}, ${schedule.language}).`;
      }
    }
  }
  return null;
}
