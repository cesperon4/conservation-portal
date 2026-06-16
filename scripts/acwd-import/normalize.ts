export function trim(value: string | undefined): string {
  return (value ?? "").trim();
}

export function trimOrNull(value: string | undefined): string | null {
  const v = trim(value);
  return v === "" ? null : v;
}

export function padAccountNo(value: string): string {
  const v = trim(value);
  return v.padStart(8, "0");
}

export function parseOptionalInt(value: string | undefined): number | null {
  const v = trim(value);
  if (v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

/** Parse ACWD dates in M/D/YY or M/D/YYYY format. */
export function parseAcwdDate(value: string | undefined): Date | null {
  const v = trim(value);
  if (v === "") return null;

  const [monthStr, dayStr, yearStr] = v.split("/");
  if (!monthStr || !dayStr || !yearStr) return null;

  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);
  let year = Number.parseInt(yearStr, 10);

  if (yearStr.length <= 2) {
    year = year >= 50 ? 1900 + year : 2000 + year;
  }

  if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function parseRequiredAcwdDate(value: string | undefined, context: string): Date {
  const date = parseAcwdDate(value);
  if (!date) {
    throw new Error(`Invalid date ${JSON.stringify(value)} (${context})`);
  }
  return date;
}
