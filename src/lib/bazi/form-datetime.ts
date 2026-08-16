export function daysInUtcMonth(year: number, month: number): number {
  if (month < 1 || month > 12 || year < 1) return 0;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function clampCivilDate(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number } | null {
  if (month < 1 || month > 12) return null;
  const maxDay = daysInUtcMonth(year, month);
  if (maxDay < 1) return null;
  const d = Math.min(Math.max(day, 1), maxDay);
  return { year, month, day: d };
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Chỉ giữ số, chèn `/` thành dd/mm/yyyy. */
export function maskDdMmYyyy(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function parseDdMmYyyy(s: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function ddMmYyyyToIso(s: string): string {
  const p = parseDdMmYyyy(s);
  if (!p) return "";
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

export function isoToDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Nhận dd/mm/yyyy, yyyy-mm-dd, hoặc chuỗi số. */
export function normalizeDdMmYyyy(raw: string): string {
  const iso = isoToDdMmYyyy(raw.trim());
  if (iso) return iso;
  const parsed = parseDdMmYyyy(raw.trim());
  if (parsed) return `${pad2(parsed.day)}/${pad2(parsed.month)}/${parsed.year}`;
  return maskDdMmYyyy(raw);
}

export function maskHhMm(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function parseHhMm(s: string): { hour: number; minute: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function normalizeHhMm(raw: string): string {
  const parsed = parseHhMm(raw.trim());
  if (parsed) return `${pad2(parsed.hour)}:${pad2(parsed.minute)}`;
  return maskHhMm(raw);
}
