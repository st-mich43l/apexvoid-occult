export function emptyV10Diagnostics(): {
  missingNatal: string[];
  missingDecade: string[];
  missingAnnual: string[];
  forbiddenMonthly: string[];
  notes: string[];
} {
  return {
    missingNatal: [],
    missingDecade: [],
    missingAnnual: [],
    forbiddenMonthly: [],
    notes: [],
  };
}
