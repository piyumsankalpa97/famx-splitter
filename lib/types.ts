export type Family = {
  id: string;
  name: string;
};

export type Person = {
  id: string;
  name: string;
  email: string;
  family_id: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  created_by: string;
  occurred_at: string;
  note: string | null;
  image_url?: string | null;
  created_at: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  person_id: string;
  share_amount: number;
};

export type Payment = {
  id: string;
  from_family_id: string;
  to_family_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
};
