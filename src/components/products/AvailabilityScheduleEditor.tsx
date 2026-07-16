'use client';

import { useEffect, useRef, useState } from 'react';
import { formatTime12h } from '@/lib/format';
import {
  WEEKDAYS,
  LANGUAGES,
  TIME_OPTIONS,
  TICKET_TYPE_PRESETS,
  newDraftId,
  validateAvailabilitySchedules,
  defaultTicketTypeConfigs,
  type Weekday,
  type AgeUnit,
  type LanguageScheduleDraft,
  type TicketTypeDraft,
  type DefaultTicketTypeConfig
} from '@/lib/availabilitySchedule';

const TODAY = new Date().toISOString().slice(0, 10);

// Builds a fresh set of TicketTypeDraft rows (own ids, independent copies)
// from a schedule's enabled Default Ticket Configuration — used to seed
// every newly-created time slot so it doesn't have to be entered by hand.
function ticketTypesFromDefaults(defaults: DefaultTicketTypeConfig[]): TicketTypeDraft[] {
  return defaults
    .filter((t) => t.enabled)
    .map((t) => ({
      id: newDraftId('tt'),
      name: t.name,
      ageFromValue: t.ageFromValue,
      ageFromUnit: t.ageFromUnit,
      ageToValue: t.ageToValue,
      ageToUnit: t.ageToUnit,
      price: t.price
    }));
}

// Plain numeric text input (no browser spinner arrows) used for prices,
// availability counts, and ages throughout this editor. Keeps its own local
// text so a trailing decimal point (e.g. while typing "12.5") isn't stripped
// mid-keystroke by the numeric value round-tripping back through props —
// only fully-typed valid numbers are ever pushed up via onChange. Local
// state is intentional: each input remounts fresh whenever its row's key
// changes, which is the only time the starting value should be picked up
// from outside.
function NumberTextInput({
  value,
  disabled,
  decimal,
  placeholder,
  className,
  onChange
}: {
  value: number;
  disabled?: boolean;
  decimal?: boolean;
  placeholder?: string;
  className?: string;
  onChange: (value: number) => void;
}) {
  const [text, setText] = useState(value === 0 ? '' : String(value));
  const pattern = decimal ? /^\d*\.?\d{0,2}$/ : /^\d*$/;

  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      disabled={disabled}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw !== '' && !pattern.test(raw)) return;
        setText(raw);
        if (raw === '' || raw === '.') {
          onChange(0);
        } else {
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }
      }}
      className={className ?? 'input text-sm py-1.5'}
    />
  );
}

function hasEnabledDefaultTicketType(schedule: LanguageScheduleDraft): boolean {
  return schedule.defaultTicketTypes.some((t) => t.enabled);
}

function canGenerateSlots(schedule: LanguageScheduleDraft): boolean {
  return schedule.defaultAvailability > 0 && hasEnabledDefaultTicketType(schedule);
}

// Language -> date range -> weekday -> time slot -> ticket type editor for
// a product's Availability section. Keeps its own tree in React state and
// serializes it into a hidden `availabilityJson` field on submit (see
// src/lib/availabilitySchedule.ts for the shared shape/parsing, used by
// both this component and the admin/supplier server actions). Validates on
// its closest <form>'s submit event — see the effect below — so it can
// block an incomplete save without ProductForm itself needing to know
// anything about this structure.
export function AvailabilityScheduleEditor({ initialSchedules }: { initialSchedules: LanguageScheduleDraft[] }) {
  const [schedules, setSchedules] = useState<LanguageScheduleDraft[]>(initialSchedules);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Which "<day> time slots" sections are expanded — collapsed by default so
  // a schedule with several active days doesn't dump every slot's fields on
  // screen at once. Purely a display toggle; doesn't touch the saved data.
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  function dayKey(scheduleId: string, day: Weekday) {
    return `${scheduleId}:${day}`;
  }
  function toggleDayExpanded(scheduleId: string, day: Weekday) {
    const key = dayKey(scheduleId, day);
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Which single time slot (by id) currently has its full ticket-type
  // configuration (names, age ranges, prices) expanded for editing. Newly
  // generated slots show only Time/Total availability/Edit/Remove by
  // default — this keeps a day with several slots from dumping every
  // ticket-type grid on screen at once. Only one slot can be open at a
  // time: clicking Edit on a different slot switches to it automatically.
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  function toggleSlotEditing(slotId: string) {
    setEditingSlotId((prev) => (prev === slotId ? null : slotId));
  }

  // Same toggle mechanism for the "Default ticket configuration" block
  // (keyed by schedule id — only one per language schedule), but this one
  // starts expanded — for every schedule already on the page at load, and
  // for each new language added afterward — since it holds required setup
  // (age ranges, prices, which ticket types are offered) suppliers need to
  // see before they can select any days below.
  const [expandedDefaults, setExpandedDefaults] = useState<Set<string>>(() => new Set(initialSchedules.map((s) => s.id)));
  function toggleDefaultsExpanded(scheduleId: string) {
    setExpandedDefaults((prev) => {
      const next = new Set(prev);
      if (next.has(scheduleId)) next.delete(scheduleId);
      else next.add(scheduleId);
      return next;
    });
  }

  useEffect(() => {
    const form = containerRef.current?.closest('form');
    if (!form) return;
    function handleSubmit(e: Event) {
      const err = validateAvailabilitySchedules(schedules);
      if (err) {
        e.preventDefault();
        setError(err);
      } else {
        setError(null);
      }
    }
    form.addEventListener('submit', handleSubmit);
    return () => form.removeEventListener('submit', handleSubmit);
  }, [schedules]);

  function addLanguage() {
    const used = new Set(schedules.map((s) => s.language));
    // English first by default (most common case) — only fall back to the
    // next unused language alphabetically once English is already taken by
    // another block.
    const nextLanguage = !used.has('English') ? 'English' : LANGUAGES.find((l) => !used.has(l)) ?? LANGUAGES[0];
    const newId = newDraftId('lang');
    setSchedules((prev) => [
      ...prev,
      {
        id: newId,
        language: nextLanguage,
        dateFrom: '',
        dateTo: '',
        defaultAvailability: 0,
        defaultTicketTypes: defaultTicketTypeConfigs(),
        slots: []
      }
    ]);
    setExpandedDefaults((prev) => new Set(prev).add(newId));
  }

  function patchDefaultTicketType(scheduleId: string, name: string, patch: Partial<DefaultTicketTypeConfig>) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, defaultTicketTypes: s.defaultTicketTypes.map((t) => (t.name === name ? { ...t, ...patch } : t)) }
          : s
      )
    );
  }

  function removeLanguage(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  function patchLanguage(id: string, patch: Partial<LanguageScheduleDraft>) {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function toggleWeekday(scheduleId: string, weekday: Weekday) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s;
        const hasDay = s.slots.some((sl) => sl.weekday === weekday);
        if (hasDay) return { ...s, slots: s.slots.filter((sl) => sl.weekday !== weekday) };
        if (!canGenerateSlots(s)) return s; // required first — see the fields above the day toggles
        return {
          ...s,
          slots: [
            ...s.slots,
            { id: newDraftId('slot'), weekday, time: '09:00', availability: s.defaultAvailability, ticketTypes: ticketTypesFromDefaults(s.defaultTicketTypes) }
          ]
        };
      })
    );
    // Every collapsible section (this one included) stays closed by default
    // everywhere — selecting a day never auto-opens its time slots list, the
    // supplier always has to click the toggle themselves. Only clean up the
    // toggle state when a day is deselected, so re-selecting it later starts
    // collapsed again rather than remembering a stale expanded state.
    setExpandedDays((prev) => {
      const key = dayKey(scheduleId, weekday);
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function addSlot(scheduleId: string, weekday: Weekday) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId || !canGenerateSlots(s)) return s;
        return {
          ...s,
          slots: [
            ...s.slots,
            { id: newDraftId('slot'), weekday, time: '09:00', availability: s.defaultAvailability, ticketTypes: ticketTypesFromDefaults(s.defaultTicketTypes) }
          ]
        };
      })
    );
  }

  function removeSlot(scheduleId: string, slotId: string) {
    setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, slots: s.slots.filter((sl) => sl.id !== slotId) } : s)));
    setEditingSlotId((prev) => (prev === slotId ? null : prev));
  }

  // "Apply Monday schedule to All Remaining Days" — clones every one of
  // Monday's time slots (time, total availability, and every ticket type's
  // name/age range/price/enabled-ness) onto Tue–Sun, replacing whatever
  // those days had before. Every cloned slot and ticket type gets a brand
  // new id (deep copy, no shared references back to Monday's rows), so
  // editing Tuesday afterward never touches Monday or any other day.
  function copyMondayToOtherDays(scheduleId: string) {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s;
        const mondaySlots = s.slots.filter((sl) => sl.weekday === 'Mon');
        if (mondaySlots.length === 0) return s;
        const otherDays = WEEKDAYS.filter((day) => day !== 'Mon');
        const clonedSlots: typeof s.slots = otherDays.flatMap((day) =>
          mondaySlots.map((slot) => ({
            ...slot,
            id: newDraftId('slot'),
            weekday: day,
            ticketTypes: slot.ticketTypes.map((t) => ({ ...t, id: newDraftId('tt') }))
          }))
        );
        return { ...s, slots: [...mondaySlots, ...clonedSlots] };
      })
    );
    // Collapse every non-Monday day's section back to closed (consistent
    // with "collapsed by default everywhere") and drop out of slot-editing
    // mode, since the ids being edited/expanded no longer exist post-copy.
    setExpandedDays((prev) => {
      const next = new Set(prev);
      for (const key of next) {
        if (key.startsWith(`${scheduleId}:`) && !key.endsWith(':Mon')) next.delete(key);
      }
      return next;
    });
    setEditingSlotId(null);
  }

  function patchSlotTime(scheduleId: string, slotId: string, time: string) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, slots: s.slots.map((sl) => (sl.id === slotId ? { ...sl, time } : sl)) } : s))
    );
  }

  function patchSlotAvailability(scheduleId: string, slotId: string, availability: number) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, slots: s.slots.map((sl) => (sl.id === slotId ? { ...sl, availability } : sl)) } : s))
    );
  }

  function addTicketType(scheduleId: string, slotId: string, preset?: (typeof TICKET_TYPE_PRESETS)[number]) {
    const draft: TicketTypeDraft = preset
      ? { id: newDraftId('tt'), name: preset.name, ageFromValue: preset.ageFromValue, ageFromUnit: preset.ageFromUnit, ageToValue: preset.ageToValue, ageToUnit: preset.ageToUnit, price: 0 }
      : { id: newDraftId('tt'), name: '', ageFromValue: 0, ageFromUnit: 'years', ageToValue: 0, ageToUnit: 'years', price: 0 };
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, slots: s.slots.map((sl) => (sl.id === slotId ? { ...sl, ticketTypes: [...sl.ticketTypes, draft] } : sl)) }
          : s
      )
    );
  }

  function removeTicketType(scheduleId: string, slotId: string, ticketTypeId: string) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              slots: s.slots.map((sl) =>
                sl.id === slotId ? { ...sl, ticketTypes: sl.ticketTypes.filter((t) => t.id !== ticketTypeId) } : sl
              )
            }
          : s
      )
    );
  }

  function patchTicketType(scheduleId: string, slotId: string, ticketTypeId: string, patch: Partial<TicketTypeDraft>) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              slots: s.slots.map((sl) =>
                sl.id === slotId
                  ? { ...sl, ticketTypes: sl.ticketTypes.map((t) => (t.id === ticketTypeId ? { ...t, ...patch } : t)) }
                  : sl
              )
            }
          : s
      )
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      <input type="hidden" name="availabilityJson" value={JSON.stringify(schedules)} readOnly />

      {error ? <p className="text-base text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p> : null}

      {schedules.length === 0 ? (
        <p className="text-base text-gray-400">No availability configured yet — add a language to get started.</p>
      ) : null}

      {schedules.map((schedule) => {
        const activeDays = WEEKDAYS.filter((day) => schedule.slots.some((sl) => sl.weekday === day));
        return (
          <div key={schedule.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <select
                value={schedule.language}
                onChange={(e) => patchLanguage(schedule.id, { language: e.target.value })}
                className="input flex-1 text-base"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => removeLanguage(schedule.id)} className="text-sm text-red-600 font-medium whitespace-nowrap">
                Remove language
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-600 mb-1 block">From date</span>
                <input
                  type="date"
                  min={TODAY}
                  value={schedule.dateFrom}
                  onChange={(e) => patchLanguage(schedule.id, { dateFrom: e.target.value })}
                  className="input text-base"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600 mb-1 block">To date</span>
                <input
                  type="date"
                  min={schedule.dateFrom || TODAY}
                  value={schedule.dateTo}
                  onChange={(e) => patchLanguage(schedule.id, { dateTo: e.target.value })}
                  className="input text-base"
                />
              </label>
            </div>

            {schedule.dateFrom && schedule.dateTo ? (
              <div>
                <label className="block mb-3">
                  <span className="text-sm font-medium text-gray-600 mb-1 block">Default number of tickets available per time slot</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 30"
                    value={schedule.defaultAvailability || ''}
                    onChange={(e) => patchLanguage(schedule.id, { defaultAvailability: Math.max(0, Number(e.target.value) || 0) })}
                    className="input w-32 text-base"
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    Applied automatically to every time slot you select below — you can still raise or lower any individual slot
                    afterward without affecting the others.
                  </span>
                </label>

                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => toggleDefaultsExpanded(schedule.id)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mb-1"
                    aria-expanded={expandedDefaults.has(schedule.id)}
                  >
                    <span className={`inline-block transition-transform ${expandedDefaults.has(schedule.id) ? 'rotate-90' : ''}`}>
                      &#9656;
                    </span>
                    Default ticket configuration
                    <span className="text-gray-400 font-normal">
                      ({schedule.defaultTicketTypes.filter((t) => t.enabled).length} enabled)
                    </span>
                  </button>

                  {expandedDefaults.has(schedule.id) ? (
                    <>
                  <p className="text-xs text-gray-400 mb-2">
                    Copied automatically onto every time slot you select below. Uncheck a type your product doesn&rsquo;t offer (e.g.
                    Senior) and it won&rsquo;t appear on any generated slot. Editing a slot afterward only changes that slot.
                  </p>
                  <div className="space-y-1.5">
                    {schedule.defaultTicketTypes.map((t) => (
                      <div
                        key={t.name}
                        className={`grid grid-cols-[auto_1fr_1fr_1fr] gap-2 items-end border rounded-lg p-2.5 ${
                          t.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'
                        }`}
                      >
                        <label className="flex items-center gap-1.5 pb-1.5">
                          <input
                            type="checkbox"
                            checked={t.enabled}
                            onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { enabled: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium w-12">{t.name}</span>
                        </label>
                        <label className="block">
                          <span className="text-xs text-gray-500 block mb-0.5">Age from</span>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!t.enabled}
                              value={t.ageFromValue}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageFromValue: Number(e.target.value) })}
                              className="input text-sm py-1.5 w-14"
                            />
                            <select
                              disabled={!t.enabled}
                              value={t.ageFromUnit}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageFromUnit: e.target.value as AgeUnit })}
                              className="input text-sm py-1.5"
                            >
                              <option value="years">Yrs</option>
                              <option value="months">Mos</option>
                            </select>
                          </div>
                        </label>
                        <label className="block">
                          <span className="text-xs text-gray-500 block mb-0.5">Age to</span>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!t.enabled}
                              value={t.ageToValue}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageToValue: Number(e.target.value) })}
                              className="input text-sm py-1.5 w-14"
                            />
                            <select
                              disabled={!t.enabled}
                              value={t.ageToUnit}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageToUnit: e.target.value as AgeUnit })}
                              className="input text-sm py-1.5"
                            >
                              <option value="years">Yrs</option>
                              <option value="months">Mos</option>
                            </select>
                          </div>
                        </label>
                        <label className="block">
                          <span className="text-xs text-gray-500 block mb-0.5">Default price</span>
                          <NumberTextInput
                            value={t.price}
                            decimal
                            disabled={!t.enabled}
                            placeholder="0 = Free"
                            onChange={(price) => patchDefaultTicketType(schedule.id, t.name, { price })}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                    </>
                  ) : null}
                </div>

                <p className="text-sm font-medium text-gray-600 mb-2">Available days</p>
                {!canGenerateSlots(schedule) ? (
                  <p className="text-xs text-amber-600 mb-2">
                    Set the default tickets available and enable at least one ticket type above before selecting days.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const active = schedule.slots.some((sl) => sl.weekday === day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!active && !canGenerateSlots(schedule)}
                        onClick={() => toggleWeekday(schedule.id, day)}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg border ${
                          active
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : !canGenerateSlots(schedule)
                              ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {schedule.slots.some((sl) => sl.weekday === 'Mon') ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Apply Monday's schedule to all other days? This replaces every other day's time slots, availability, ticket types, ages, and prices with a copy of Monday's — this can't be undone (short of leaving without saving)."
                        )
                      ) {
                        copyMondayToOtherDays(schedule.id);
                      }
                    }}
                    className="text-sm text-blue-600 font-medium mt-2"
                  >
                    Apply Monday schedule to all remaining days
                  </button>
                ) : null}
              </div>
            ) : null}

            {activeDays.map((day) => {
              const daySlotCount = schedule.slots.filter((sl) => sl.weekday === day).length;
              const isExpanded = expandedDays.has(dayKey(schedule.id, day));
              return (
              <div key={day} className="border-t border-gray-100 pt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => toggleDayExpanded(schedule.id, day)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
                  aria-expanded={isExpanded}
                >
                  <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&#9656;</span>
                  {day} time slots
                  <span className="text-gray-400 font-normal">({daySlotCount})</span>
                </button>

                {isExpanded ? (
                  <>
                {schedule.slots
                  .filter((sl) => sl.weekday === day)
                  .map((slot) => {
                    const isEditingSlot = editingSlotId === slot.id;
                    return (
                    <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={slot.time}
                          onChange={(e) => patchSlotTime(schedule.id, slot.id, e.target.value)}
                          className="input w-40 text-base"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {formatTime12h(t)}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5">
                          <span className="text-sm text-gray-500 whitespace-nowrap">Total availability</span>
                          <NumberTextInput
                            value={slot.availability}
                            onChange={(availability) => patchSlotAvailability(schedule.id, slot.id, availability)}
                            className="input w-20 text-base py-1.5"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleSlotEditing(slot.id)}
                          className={`text-sm font-medium px-2.5 py-1 rounded-lg border ml-auto ${
                            isEditingSlot ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {isEditingSlot ? 'Done editing' : 'Edit price'}
                        </button>
                        <button type="button" onClick={() => removeSlot(schedule.id, slot.id)} className="text-sm text-red-600 font-medium">
                          Remove time slot
                        </button>
                      </div>

                      {isEditingSlot ? (
                        <>
                      <p className="text-xs text-gray-400 -mt-1">
                        Shared inventory for this departure — every ticket type below books against this same pool.
                      </p>

                      <div className="space-y-2">
                        {slot.ticketTypes.map((t) => (
                          <div key={t.id} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end bg-white border border-gray-200 rounded-lg p-2.5">
                            <label className="block col-span-2">
                              <span className="text-xs text-gray-500 block mb-0.5">Name</span>
                              <input
                                value={t.name}
                                onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { name: e.target.value })}
                                className="input text-sm py-1.5"
                                placeholder="e.g. Adult"
                              />
                            </label>
                            <label className="block">
                              <span className="text-xs text-gray-500 block mb-0.5">Age from</span>
                              <div className="flex gap-1">
                                <NumberTextInput
                                  value={t.ageFromValue}
                                  onChange={(ageFromValue) => patchTicketType(schedule.id, slot.id, t.id, { ageFromValue })}
                                  className="input text-sm py-1.5 w-14"
                                />
                                <select
                                  value={t.ageFromUnit}
                                  onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { ageFromUnit: e.target.value as AgeUnit })}
                                  className="input text-sm py-1.5"
                                >
                                  <option value="years">Yrs</option>
                                  <option value="months">Mos</option>
                                </select>
                              </div>
                            </label>
                            <label className="block">
                              <span className="text-xs text-gray-500 block mb-0.5">Age to</span>
                              <div className="flex gap-1">
                                <NumberTextInput
                                  value={t.ageToValue}
                                  onChange={(ageToValue) => patchTicketType(schedule.id, slot.id, t.id, { ageToValue })}
                                  className="input text-sm py-1.5 w-14"
                                />
                                <select
                                  value={t.ageToUnit}
                                  onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { ageToUnit: e.target.value as AgeUnit })}
                                  className="input text-sm py-1.5"
                                >
                                  <option value="years">Yrs</option>
                                  <option value="months">Mos</option>
                                </select>
                              </div>
                            </label>
                            <label className="block">
                              <span className="text-xs text-gray-500 block mb-0.5">Price</span>
                              <div className="flex items-center gap-1">
                                <NumberTextInput
                                  value={t.price}
                                  decimal
                                  onChange={(price) => patchTicketType(schedule.id, slot.id, t.id, { price })}
                                  className="input text-sm py-1.5"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeTicketType(schedule.id, slot.id, t.id)}
                                  aria-label="Remove ticket type"
                                  className="text-red-500 text-base px-1"
                                >
                                  &times;
                                </button>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {TICKET_TYPE_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => addTicketType(schedule.id, slot.id, preset)}
                            className="text-xs border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-100"
                          >
                            + {preset.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => addTicketType(schedule.id, slot.id)}
                          className="text-xs border border-dashed border-gray-300 rounded-full px-2.5 py-1 text-gray-500 hover:bg-gray-100"
                        >
                          + Custom ticket type
                        </button>
                      </div>
                        </>
                      ) : null}
                    </div>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => addSlot(schedule.id, day)}
                  disabled={!canGenerateSlots(schedule)}
                  className="text-sm text-blue-600 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  + Add another time slot for {day}
                </button>
                  </>
                ) : null}
              </div>
              );
            })}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addLanguage}
        className="text-base font-medium text-blue-600 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50"
      >
        + Add language
      </button>
    </div>
  );
}
