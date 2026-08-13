# Trip Expense Splitter — Build Guide

A private, mobile only web app for 10 people on one trip to log expenses and see what each family owes. No login/password, just pick your identity from a list. Built with Next.js and Supabase.

This file is written to be handed directly to a local coding agent. Follow it in order.

---

## 0. Before you start (human, not agent)

Fill in the real data below before running the agent. The agent should stop and ask if this section still has placeholders.

```
PEOPLE (name, email, family):
1. Piyum Sankalpa, piyum@gmail.com, Family C
2. Aloka Kumarasinghe, alo@gmail.com, Family C
3. Thusitha Muththunga, thusitha@gmail.com, Family A
4. Malkanthi Pathiraja, mal@gmail.com, Family A
5. Gimhani Sankalpana, gim@gmail.com, Family A
6. Elan, elan@gmail.com, Family A
7. Savithri Wickramanayake, ganga@gmail.com, Family D
8. Mala Kanangama, mala@gmail.com, Family B
9. Mahinda Kumara, mahinda@gmail.com, Family B
10. Daham Kumarasinghe, daham@gmail.com, Family B

FAMILIES (name each family, even single-person ones):
Family A: Yakkala
Family B: Radawana
Family C: Yuhas
Family D: Ganga
```

---

## 1. Tech stack

- Next.js 14, App Router, TypeScript
- Supabase (Postgres) for data, using `@supabase/supabase-js`
- Tailwind CSS
- `lucide-react` for icons
- `framer-motion` for the one motion moment (see Design section)
- Deployed on Vercel

No auth library. "Login" is just picking your email from a list, stored in `localStorage` on that device.

**Security note, be honest with the user about this:** with no real auth, RLS policies will be left open (anon key can read/write everything). Anyone with the URL and anon key could edit or wipe data. This is acceptable only because it's a private link shared with 10 trusted people. Do not reuse this pattern for anything public.

---

## 2. Database schema

Run this in the Supabase SQL editor.

```sql
create extension if not exists "pgcrypto";

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  family_id uuid not null references families(id)
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount numeric(12,2) not null,
  paid_by uuid not null references people(id),
  created_by uuid not null references people(id),
  occurred_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  person_id uuid not null references people(id),
  share_amount numeric(12,2) not null
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  from_family_id uuid not null references families(id),
  to_family_id uuid not null references families(id),
  amount numeric(12,2) not null,
  paid_at timestamptz not null default now(),
  note text
);

-- RLS open for anon key, since there is no auth. See security note above.
alter table families enable row level security;
alter table people enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table payments enable row level security;

create policy "anon full access" on families for all using (true) with check (true);
create policy "anon full access" on people for all using (true) with check (true);
create policy "anon full access" on expenses for all using (true) with check (true);
create policy "anon full access" on expense_splits for all using (true) with check (true);
create policy "anon full access" on payments for all using (true) with check (true);
```

Then seed `families` and `people` with the real data from section 0.

---

## 3. Core logic (implement in `/lib`)

### 3.1 Adding an expense

Input: title, amount, paidBy (person id), occurredAt, splitTo (`"all"` or array of person ids), note, createdBy.

1. Resolve the member list: `"all"` → all 10 people, otherwise the selected ids.
2. `shareAmount = round(amount / memberCount, 2)`.
3. Because rounding can leave a cent or two unaccounted for, add the leftover remainder to the payer's own share so the splits always sum exactly to `amount`.
4. Insert one row into `expenses`, then one row per member into `expense_splits`.

### 3.2 Per person balance

```
paidTotal(person)  = sum(expenses.amount)   where expenses.paid_by = person
owedTotal(person)  = sum(expense_splits.share_amount) where expense_splits.person_id = person
personNet(person)  = paidTotal(person) - owedTotal(person)
```

### 3.3 Per family balance

```
familyRaw(family) = sum(personNet(p)) for every person p in family

paymentsReceived(family) = sum(payments.amount) where payments.to_family_id = family
paymentsMade(family)     = sum(payments.amount) where payments.from_family_id = family

familyNet(family) = familyRaw(family) + paymentsReceived(family) - paymentsMade(family)
```

`familyNet > 0` → this family is owed money. `familyNet < 0` → this family owes money.

### 3.4 Settle up algorithm (minimum transactions)

Standard debt simplification, same idea Splitwise uses:

1. Compute `familyNet` for every family.
2. Split into creditors (`net > 0`) and debtors (`net < 0`), sorted by size descending.
3. Repeatedly take the largest debtor and largest creditor, transfer `min(abs(debtor), creditor)` between them, record it as a suggested transaction, reduce both balances, drop any that hit zero.
4. Repeat until all balances are zero. This produces the shortest possible "who pays whom" list instead of every family paying every other family.

### 3.5 Marking a settlement paid

When the user taps "mark as paid" on a suggested transaction (or enters a custom amount), insert a row into `payments` with that `from_family_id`, `to_family_id`, and `amount`. Recompute balances after insert. This is the only place the app writes to `payments`.

### 3.6 Edit and delete permissions

Only `expenses.created_by === current active person id` can see edit/delete controls on that expense. This is a UI level check only, not enforced by the database (see security note in section 1).

---

## 4. Screens

1. **Identity picker** (`/`) — grid of 10 names, tap to select, saved to `localStorage`. Revisit anytime via a small avatar button in the top bar to switch identity (useful if someone hands their phone to another family member).
2. **Dashboard** (`/dashboard`) — one balance card per family, showing paid total, owed total, and net, sorted so the family in the biggest debt appears first.
3. **Expenses** (`/expenses`) — reverse chronological list, each entry a receipt-style card (see Design). Filter by family or by "who paid." Tapping an expense opens details; edit/delete only shown to the creator.
4. **Add expense** (`/expenses/new`) — title, amount, who paid, date/time (default to now), split to all or pick members, optional note.
5. **Settle up** (`/settle`) — the simplified transaction list from 3.4, each with a "mark as paid" action; a small history section below showing past payments.

Bottom tab bar: Dashboard, Expenses, Add (center, raised), Settle Up. No desktop layout needed, build for a single mobile viewport width (max ~430px content, centered on larger screens if opened on desktop, but don't spend time on a separate desktop design).

---

## 5. Design direction

Subject: a small group trip. The app should feel like a travel companion, not a spreadsheet. Avoid the generic AI-app look (cream background with terracotta accent, or all-black with one neon accent, or a hairline-rule newspaper grid). Go with a postcard / boarding-pass feel instead, since it's specific to travel and nobody else's expense splitter will look like it.

**Color tokens**
- Background: `#F7F9FC` (cool paper white, not cream)
- Ink / primary text: `#1B2A4A` (deep navy)
- Primary accent: `#FF6B5E` (coral, for the add button and positive actions)
- Secondary accent: `#FFC857` (sunny yellow, for highlights and the settle-up screen)
- Success: `#4CB8A0` (seafoam, used only when something is fully settled)
- Family tag colors: assign each family one pastel from a fixed set (`#FFD9CE`, `#CDEAE5`, `#FFEFB0`, `#D8E2FF`, `#E6D9FF`) so a family is visually recognizable across every screen without reading the label.

**Type**
- Display face (titles, amounts, balances): "Fredoka" — rounded, friendly, a little playful without being childish.
- Body face: "Inter" or "Manrope" for everything else, keeps it readable.
- Money amounts specifically get a monospaced utility face, e.g. "IBM Plex Mono," so digits align and feel receipt-like.

**Signature element**
Expense cards are styled like a torn ticket stub: a dashed perforation line partway across the card with small circular notches cut into the edges, separating the "what and who paid" side from the "amount" side. Family balance cards on the dashboard are styled like luggage tags, a rounded rectangle with a small punched hole and a loop, colored by that family's pastel.

**Motion**
Keep it to one deliberate moment, not scattered effects: when a settlement is marked paid, the transaction row collapses with a short check animation. Everything else (page transitions, list loading) stays simple and fast, no extra flourishes.

**Empty states**
Write these in the app's own voice, not apologetic. Example: an empty expense list says "No expenses yet. Add the first one." not "Sorry, nothing here."

---

## 6. Suggested file structure

```
/app
  layout.tsx
  page.tsx                 -> identity picker
  dashboard/page.tsx
  expenses/page.tsx
  expenses/new/page.tsx
  settle/page.tsx
/components
  BottomNav.tsx
  FamilyBalanceCard.tsx    (luggage tag style)
  ExpenseCard.tsx          (ticket stub style)
  MemberPicker.tsx
  AmountInput.tsx
  SettleTransactionRow.tsx
/lib
  supabaseClient.ts
  balances.ts              (section 3.2 - 3.3)
  settleAlgorithm.ts       (section 3.4)
  types.ts
/styles
  globals.css
```

---

## 7. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Both are safe to expose client side since there is no sensitive server-only logic, all access control is the open RLS policy described in section 2.

---

## 8. Build order for the agent

1. Scaffold Next.js + Tailwind + Supabase client.
2. Run the schema in section 2, seed real people and families.
3. Build identity picker and the "switch identity" flow first, everything else depends on knowing who's active.
4. Build `lib/balances.ts` and `lib/settleAlgorithm.ts` with unit-style sanity checks (a few hardcoded expenses in, expected balances out) before wiring up any UI.
5. Build Add Expense screen and confirm rows land correctly in `expenses` and `expense_splits`.
6. Build Dashboard and Expenses list.
7. Build Settle Up screen and the mark-as-paid flow.
8. Pass over styling last, applying section 5 once everything works functionally.

---

## 9. Explicitly out of scope

- No multi-currency support (LKR only).
- No push notifications or real-time sync, refresh to see others' updates.
- No password auth or account recovery.
- No desktop-optimized layout.
