// Builds a data: URI for a minimal .ics calendar file, so "Add to calendar"
// works client-side with no backend involved.

function toIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

export function buildIcsDataUri(options: {
  title: string;
  description: string;
  location: string;
  start: Date;
  durationMinutes?: number;
}): string {
  const { title, description, location, start, durationMinutes = 120 } = options;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vacay in Barcelona//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@vacayinbarcelona.com`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location.replace(/\n/g, ' ')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const ics = lines.join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
