# Trip Expense Splitter — Agent Reference

## 1. Project Overview
A private, mobile-only web app for 10 people (4 families) on one trip to log expenses and see what each family owes.
- **Name:** Anu Pol Trip
- **Goal:** Custom Splitwise clone for a family trip.
- **Tech Stack:** Next.js 14 (App Router, TypeScript), Supabase (Postgres for data via `@supabase/supabase-js`), Tailwind CSS, `lucide-react`, `framer-motion`.
- **Deployment:** Vercel.
- **Auth:** No login/password. Identity is picked from a list and stored in `localStorage`.
- **Constraints:** LKR currency only, no desktop layout needed (max ~430px content width).

## 2. Installed Skills & Guidelines
Agents working on this project must adhere to the following installed skills:
- **`design-taste-frontend` & `frontend-design`:** 
  - Avoid templated, generic, or "slop" AI app looks.
  - Implement a distinctive "postcard/boarding-pass" feel.
  - Use specific colors: Background `#F7F9FC` (cool paper white), Ink `#1B2A4A`, Accents `#FF6B5E` (coral) and `#FFC857` (sunny yellow), Success `#4CB8A0` (seafoam).
  - Assign specific pastel colors for each family (`#FFD9CE`, `#CDEAE5`, `#FFEFB0`, `#D8E2FF`, `#E6D9FF`).
  - Typography: *Fredoka* for display/titles, *Inter* or *Manrope* for body, *IBM Plex Mono* for money amounts.
  - Signature components: Torn ticket stub style for expenses, luggage tag style for family balances.
- **`supabase`:**
  - Standard SSR and client integration best practices.
  - Note: Security relies on open RLS because there is no auth (private app link). Do not reuse this pattern publicly.

## 3. Basic Logic & Architecture

### Database Schema
- **`families`**: (id, name)
- **`people`**: (id, name, email, family_id)
- **`expenses`**: (id, title, amount, paid_by, created_by, occurred_at, note, created_at)
- **`expense_splits`**: (id, expense_id, person_id, share_amount)
- **`payments`**: (id, from_family_id, to_family_id, amount, paid_at, note)

### Core Logic (`/lib`)
1. **Adding an Expense:**
   - Amount is split equally among selected members.
   - Rounding remainders are added to the payer's share so splits sum perfectly.
   - Insert one row into `expenses` and one row per member into `expense_splits`.
2. **Per Person Balance:**
   - `personNet = sum(paid by person) - sum(owed by person)`
3. **Per Family Balance:**
   - `familyNet = sum(personNet for all family members) + sum(payments received) - sum(payments made)`
   - `> 0` means the family is owed money; `< 0` means the family owes money.
4. **Settle Up Algorithm (Debt Simplification):**
   - Compute `familyNet` for every family.
   - Separate families into creditors (`net > 0`) and debtors (`net < 0`).
   - Transfer `min(abs(debtor), creditor)` between largest debtor and largest creditor.
   - Repeat until all balances are zero, producing a minimal list of suggested transactions.
5. **Marking a Settlement Paid:**
   - Insert row into `payments` when a suggested transaction is marked as paid. Recompute balances.

## 4. Build Order (Quick Reference)
1. Scaffold Next.js + Tailwind + Supabase client.
2. Setup Supabase schema and seed data.
3. Build Identity Picker (`/`) - required for everything else.
4. Build Core Logic (`lib/balances.ts`, `lib/settleAlgorithm.ts`) with unit-style sanity checks.
5. Build Add Expense screen (`/expenses/new`).
6. Build Dashboard (`/dashboard`) and Expenses list (`/expenses`).
7. Build Settle Up screen (`/settle`).
8. Apply design styling based on the postcard/boarding-pass direction once functional.
