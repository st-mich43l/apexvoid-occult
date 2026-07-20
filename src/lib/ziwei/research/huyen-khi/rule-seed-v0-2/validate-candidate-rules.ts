export function validateCandidateRules(data: any) {
  if (data.rules.effective !== false) throw new Error("effective must be false");
  return true;
}