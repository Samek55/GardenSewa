// Budget is free text ("12,750", "Below NPR 5000"); the payable amount lives in
// booking.deal_amount (numeric). When a gardener edits the budget to a plain
// number, that number is also the new agreed price — anything else (a range
// label) leaves deal_amount untouched.
export function parsePlainAmount(value: unknown): number | null {
  const cleaned = String(value ?? '').replace(/[,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}
