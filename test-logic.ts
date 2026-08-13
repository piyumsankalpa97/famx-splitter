import { calculateBalances } from './lib/balances';
import { calculateSettleTransactions } from './lib/settleAlgorithm';
import { Family, Person, Expense, ExpenseSplit, Payment } from './lib/types';

// Mock Data
const families: Family[] = [
  { id: 'f1', name: 'Family A' },
  { id: 'f2', name: 'Family B' },
  { id: 'f3', name: 'Family C' },
];

const people: Person[] = [
  { id: 'p1', name: 'P1', email: 'p1@test', family_id: 'f1' },
  { id: 'p2', name: 'P2', email: 'p2@test', family_id: 'f2' },
  { id: 'p3', name: 'P3', email: 'p3@test', family_id: 'f3' },
];

const expenses: Expense[] = [
  { id: 'e1', title: 'Dinner', amount: 300, paid_by: 'p1', created_by: 'p1', occurred_at: new Date().toISOString(), note: null, created_at: new Date().toISOString() },
  { id: 'e2', title: 'Lunch', amount: 90, paid_by: 'p2', created_by: 'p2', occurred_at: new Date().toISOString(), note: null, created_at: new Date().toISOString() },
];

// e1: Dinner (300) split by p1, p2, p3 => 100 each
// p1 paid 300, owes 100 => +200
// p2 owes 100 => -100
// p3 owes 100 => -100
const splits1: ExpenseSplit[] = [
  { id: 's1', expense_id: 'e1', person_id: 'p1', share_amount: 100 },
  { id: 's2', expense_id: 'e1', person_id: 'p2', share_amount: 100 },
  { id: 's3', expense_id: 'e1', person_id: 'p3', share_amount: 100 },
];

// e2: Lunch (90) split by p2, p3 => 45 each
// p2 paid 90, owes 45 => +45 (Total p2: -100 + 45 = -55)
// p3 owes 45 => -45 (Total p3: -100 - 45 = -145)
const splits2: ExpenseSplit[] = [
  { id: 's4', expense_id: 'e2', person_id: 'p2', share_amount: 45 },
  { id: 's5', expense_id: 'e2', person_id: 'p3', share_amount: 45 },
];

const payments: Payment[] = [];

console.log("--- Running Sanity Checks ---");

const balances = calculateBalances(families, people, expenses, [...splits1, ...splits2], payments);

console.log("Person Net:");
console.log(`p1 (Expected 200): ${balances.personNet['p1']}`);
console.log(`p2 (Expected -55): ${balances.personNet['p2']}`);
console.log(`p3 (Expected -145): ${balances.personNet['p3']}`);

console.log("\nFamily Net:");
console.log(`f1 (Expected 200): ${balances.familyNet['f1']}`);
console.log(`f2 (Expected -55): ${balances.familyNet['f2']}`);
console.log(`f3 (Expected -145): ${balances.familyNet['f3']}`);

const txs = calculateSettleTransactions(balances.familyNet);
console.log("\nSettle Transactions:");
console.log(txs);
// Expected: f3 pays f1 145, f2 pays f1 55

// Let's add a payment
const payments2: Payment[] = [
  { id: 'pay1', from_family_id: 'f3', to_family_id: 'f1', amount: 100, paid_at: new Date().toISOString(), note: null }
];
const balances2 = calculateBalances(families, people, expenses, [...splits1, ...splits2], payments2);
console.log("\nAfter Payment (f3 pays f1 100):");
console.log(`f1 Net (Expected 100): ${balances2.familyNet['f1']}`);
console.log(`f3 Net (Expected -45): ${balances2.familyNet['f3']}`);

const txs2 = calculateSettleTransactions(balances2.familyNet);
console.log("\nSettle Transactions After Payment:");
console.log(txs2);
// Expected: f2 pays f1 55, f3 pays f1 45

let allPassed = true;
if (balances.personNet['p1'] !== 200) allPassed = false;
if (balances.personNet['p2'] !== -55) allPassed = false;
if (balances.personNet['p3'] !== -145) allPassed = false;
if (balances2.familyNet['f1'] !== 100) allPassed = false;
if (balances2.familyNet['f3'] !== -45) allPassed = false;
if (txs[0].amount !== 145) allPassed = false;

if (allPassed) {
  console.log("\n✅ ALL TESTS PASSED!");
} else {
  console.error("\n❌ TESTS FAILED!");
  process.exit(1);
}
