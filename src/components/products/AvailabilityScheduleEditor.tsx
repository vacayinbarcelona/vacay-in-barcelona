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
    setSchedules((prev) => [
      ...prev,
      {
        id: newDraftId('lang'),
        language: nextLanguage,
        dateFrom: '',
        dateTo: '',
        defaultAvailability: 0,
        defaultTicketTypes: defaultTicketTypeConfigs(),
        slots: []
      }
    ]);
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

      {error ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p> : null}

      {schedules.length === 0 ? (
        <p className="text-sm text-gray-400">No availability configured yet — add a language to get started.</p>
      ) : null}

      {schedules.map((schedule) => {
        const activeDays = WEEKDAYS.filter((day) => schedule.slots.some((sl) => sl.weekday === day));
        return (
          <div key={schedule.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <select
                value={schedule.language}
                onChange={(e) => patchLanguage(schedule.id, { language: e.target.value })}
                className="input flex-1"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => removeLanguage(schedule.id)} className="text-xs text-red-600 font-medium whitespace-nowrap">
                Remove language
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-600 mb-1 block">From date</span>
                <input
                  type="date"
                  min={TODAY}
                  value={schedule.dateFrom}
                  onChange={(e) => patchLanguage(schedule.id, { dateFrom: e.target.value })}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600 mb-1 block">To date</span>
                <input
                  type="date"
                  min={schedule.dateFrom || TODAY}
                  value={schedule.dateTo}
                  onChange={(e) => patchLanguage(schedule.id, { dateTo: e.target.value })}
                  className="input"
                />
              </label>
            </div>

            {schedule.dateFrom && schedule.dateTo ? (
              <div>
                <label className="block mb-3">
                  <span className="text-xs font-medium text-gray-600 mb-1 block">Default number of tickets available per time slot</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 30"
                    value={schedule.defaultAvailability || ''}
                    onChange={(e) => patchLanguage(schedule.id, { defaultAvailability: Math.max(0, Number(e.target.value) || 0) })}
                    className="input w-32"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Applied automatically to every time slot you select below — you can still raise or lower any individual slot
                    afterward without affecting the others.
                  </span>
                </label>

                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Default ticket configuration</p>
                  <p className="text-[11px] text-gray-400 mb-2">
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
                          <span className="text-xs font-medium w-12">{t.name}</span>
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-gray-500 block mb-0.5">Age from</span>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!t.enabled}
                              value={t.ageFromValue}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageFromValue: Number(e.target.value) })}
                              className="input text-xs py-1.5 w-14"
                            />
                            <select
                              disabled={!t.enabled}
                              value={t.ageFromUnit}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageFromUnit: e.target.value as AgeUnit })}
                              className="input text-xs py-1.5"
                            >
                              <option value="years">Yrs</option>
                              <option value="months">Mos</option>
                            </select>
                          </div>
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-gray-500 block mb-0.5">Age to</span>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="0"
                              disabled={!t.enabled}
                              value={t.ageToValue}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageToValue: Number(e.target.value) })}
                              className="input text-xs py-1.5 w-14"
                            />
                            <select
                              disabled={!t.enabled}
                              value={t.ageToUnit}
                              onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { ageToUnit: e.target.value as AgeUnit })}
                              className="input text-xs py-1.5"
                            >
                              <option value="years">Yrs</option>
                              <option value="months">Mos</option>
                            </select>
                          </div>
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-gray-500 block mb-0.5">Default price</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!t.enabled}
                            placeholder="0 = Free"
                            value={t.price}
                            onChange={(e) => patchDefaultTicketType(schedule.id, t.name, { price: Number(e.target.value) })}
                            className="input text-xs py-1.5"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs font-medium text-gray-600 mb-2">Available days</p>
                {!canGenerateSlots(schedule) ? (
                  <p className="text-[11px] text-amber-600 mb-2">
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
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
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
              </div>
            ) : null}

            {activeDays.map((day) => (
              <div key={day} className="border-t border-gray-100 pt-3 space-y-3">
                <p className="text-xs font-semibold text-gray-700">{day} time slots</p>

                {schedule.slots
                  .filter((sl) => sl.weekday === day)
                  .map((slot) => (
                    <div key={slot.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={slot.time}
                          onChange={(e) => patchSlotTime(schedule.id, slot.id, e.target.value)}
                          className="input w-40"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {formatTime12h(t)}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500 whitespace-nowrap">Total availability</span>
                          <input
                            type="number"
                            min="0"
                            value={slot.availability}
                            onChange={(e) => patchSlotAvailability(schedule.id, slot.id, Number(e.target.value))}
                            className="input w-20 text-sm py-1.5"
                          />
                        </label>
                        <button type="button" onClick={() => removeSlot(schedule.id, slot.id)} className="text-xs text-red-600 font-medium ml-auto">
                          Remove time slot
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400 -mt-1">
                        Shared inventory for this departure — every ticket type below books against this same pool.
                      </p>

                      <div className="space-y-2">
                        {slot.ticketTypes.map((t) => (
                          <div key={t.id} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end bg-white border border-gray-200 rounded-lg p-2.5">
                            <label className="block col-span-2">
                              <span className="text-[10px] text-gray-500 block mb-0.5">Name</span>
                              <input
                                value={t.name}
                                onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { name: e.target.value })}
                                className="input text-xs py-1.5"
                                placeholder="e.g. Adult"
                              />
                            </label>
                            <label className="block">
                              <span className="text-[10px] text-gray-500 block mb-0.5">Age from</span>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={t.ageFromValue}
                                  onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { ageFromValue: Number(e.target.value) })}
                                  className="input text-xs py-1.5 w-14"
                                />
                                <select
                                  value={t.ageFromUnit}
                                  onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { ageFromUnit: e.target.value as AgeUnit })}
                                  className="input text-xs py-1.5"
                                >
                                  <option value="years">Yrs</option>
                                  <option value="months">Mos</option>
                                </select>
                              </div>
                            </label>
                            <label className="block">
                              <span className="text-[10px] text-gray-500 block mb-0.5">Age to</span>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={t.ageToValue}
                                  onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { ageToValue: Number(e.target.value) })}
                                  className="input text-xs py-1.5 w-14"
                                />
                                <select
                                  value={t.ageToUnit}
                                  onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { ageToUnit: e.target.value as AgeUnit })}
                                  className="input text-xs py-1.5"
                                >
                                  <option value="years">Yrs</option>
                                  <option value="months">Mos</option>
                                </select>
                              </div>
                            </label>
                            <label className="block">
                              <span className="text-[10px] text-gray-500 block mb-0.5">Price</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={t.price}
                                  onChange={(e) => patchTicketType(schedule.id, slot.id, t.id, { price: Number(e.target.value) })}
                                  className="input text-xs py-1.5"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeTicketType(schedule.id, slot.id, t.id)}
                                  aria-label="Remove ticket type"
                                  className="text-red-500 text-sm px-1"
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
                            className="text-[11px] border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-100"
                          >
                            + {preset.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => addTicketType(schedule.id, slot.id)}
                          className="text-[11px] border border-dashed border-gray-300 rounded-full px-2.5 py-1 text-gray-500 hover:bg-gray-100"
                        >
                          + Custom ticket type
                        </button>
                      </div>
                    </div>
                  ))}

                <button
                  type="button"
                  onClick={() => addSlot(schedule.id, day)}
                  disabled={!canGenerateSlots(schedule)}
                  className="text-xs text-blue-600 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  + Add another time slot for {day}
                </button>
              </div>
            ))}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addLanguage}
        className="text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-50"
      >
        + Add language
      </button>
    </div>
  );
}
