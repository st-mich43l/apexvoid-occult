
// Domains were removed in Monthly Flow V0.3 production
// The following constants were kept if needed elsewhere, but mostly deprecated.

export function formatMonthShortLabel(lunarMonth: number, isLeapMonth: boolean): string {
  return isLeapMonth ? `Th.${lunarMonth} nhuận` : `Th.${lunarMonth}`;
}

export function formatMonthViewLabel(lunarMonth: number, isLeapMonth: boolean): string {
  return isLeapMonth
    ? `Tháng ${lunarMonth} nhuận âm lịch`
    : `Tháng ${lunarMonth} âm lịch`;
}
