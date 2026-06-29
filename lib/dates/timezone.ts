const DATE_KEY_PARTS = ["year", "month", "day"] as const;

type DateKeyPart = (typeof DATE_KEY_PARTS)[number];

function createDateFormatter(timeZone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    throw new Error(`Invalid IANA time zone "${timeZone}".`);
  }
}

export function toLocalDateKey(date: Date, timeZone: string): string {
  const formatter = createDateFormatter(timeZone);
  const parts = formatter.formatToParts(date).reduce<Partial<Record<DateKeyPart, string>>>(
    (dateParts, part) => {
      if (DATE_KEY_PARTS.includes(part.type as DateKeyPart)) {
        dateParts[part.type as DateKeyPart] = part.value;
      }

      return dateParts;
    },
    {},
  );

  if (!parts.year || !parts.month || !parts.day) {
    throw new Error(`Unable to format date in IANA time zone "${timeZone}".`);
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getTodayInTimeZone(timeZone: string, now = new Date()): string {
  return toLocalDateKey(now, timeZone);
}
