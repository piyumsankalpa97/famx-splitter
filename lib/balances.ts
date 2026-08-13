import { Expense, ExpenseSplit, Payment, Person, Family } from './types';

export function calculateBalances(
  families: Family[],
  people: Person[],
  expenses: Expense[],
  expenseSplits: ExpenseSplit[],
  payments: Payment[]
) {
  // Calculate per person net
  const personNet: Record<string, number> = {};
  for (const p of people) {
    personNet[p.id] = 0;
  }

  // Add what they paid
  for (const exp of expenses) {
    if (personNet[exp.paid_by] !== undefined) {
      personNet[exp.paid_by] += Number(exp.amount);
    }
  }

  // Subtract what they owe
  for (const split of expenseSplits) {
    if (personNet[split.person_id] !== undefined) {
      personNet[split.person_id] -= Number(split.share_amount);
    }
  }

  // Calculate per family raw net
  const familyRaw: Record<string, number> = {};
  const familyPaidTotal: Record<string, number> = {};
  const familyOwedTotal: Record<string, number> = {};

  for (const f of families) {
    familyRaw[f.id] = 0;
    familyPaidTotal[f.id] = 0;
    familyOwedTotal[f.id] = 0;
  }

  // Calculate family paid and owed totals
  for (const exp of expenses) {
    const person = people.find(p => p.id === exp.paid_by);
    if (person && familyPaidTotal[person.family_id] !== undefined) {
      familyPaidTotal[person.family_id] += Number(exp.amount);
    }
  }

  for (const split of expenseSplits) {
    const person = people.find(p => p.id === split.person_id);
    if (person && familyOwedTotal[person.family_id] !== undefined) {
      familyOwedTotal[person.family_id] += Number(split.share_amount);
    }
  }

  for (const p of people) {
    if (familyRaw[p.family_id] !== undefined) {
      familyRaw[p.family_id] += personNet[p.id];
    }
  }

  // Adjust for payments
  const familyNet: Record<string, number> = { ...familyRaw };
  const paymentsReceived: Record<string, number> = {};
  const paymentsMade: Record<string, number> = {};

  for (const f of families) {
    paymentsReceived[f.id] = 0;
    paymentsMade[f.id] = 0;
  }

  for (const p of payments) {
    if (paymentsReceived[p.to_family_id] !== undefined) {
      paymentsReceived[p.to_family_id] += Number(p.amount);
      familyNet[p.to_family_id] -= Number(p.amount); // Receiving payment reduces what they are owed
    }
    if (paymentsMade[p.from_family_id] !== undefined) {
      paymentsMade[p.from_family_id] += Number(p.amount);
      familyNet[p.from_family_id] += Number(p.amount); // Making a payment reduces their debt (moves closer to 0)
    }
  }

  return { personNet, familyRaw, familyNet, familyPaidTotal, familyOwedTotal, paymentsReceived, paymentsMade };
}
