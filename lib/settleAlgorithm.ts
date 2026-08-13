export type Transaction = {
  from_family_id: string;
  to_family_id: string;
  amount: number;
};

export function calculateSettleTransactions(familyNet: Record<string, number>): Transaction[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, net] of Object.entries(familyNet)) {
    if (net > 0.01) creditors.push({ id, amount: net });
    if (net < -0.01) debtors.push({ id, amount: Math.abs(net) });
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const c = creditors[cIdx];
    const d = debtors[dIdx];

    const amount = Math.min(c.amount, d.amount);
    
    // Round to 2 decimals to prevent floating point issues
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        from_family_id: d.id,
        to_family_id: c.id,
        amount: roundedAmount,
      });
    }

    c.amount -= amount;
    d.amount -= amount;

    if (c.amount < 0.01) cIdx++;
    if (d.amount < 0.01) dIdx++;
  }

  return transactions;
}
