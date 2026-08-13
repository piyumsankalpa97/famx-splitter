"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Expense, Person } from "@/lib/types";
import { ExpenseCard } from "@/components/ExpenseCard";
import { Loader2, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExpensesList() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);

  useEffect(() => {
    setActivePersonId(localStorage.getItem("active_person_id"));

    async function load() {
      const [eRes, pRes] = await Promise.all([
        supabase.from("expenses").select("*").order("occurred_at", { ascending: false }),
        supabase.from("people").select("*")
      ]);
      
      if (eRes.data) setExpenses(eRes.data as Expense[]);
      if (pRes.data) {
        const pMap: Record<string, Person> = {};
        for (const p of (pRes.data as Person[])) {
          pMap[p.id] = p;
        }
        setPeople(pMap);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6B5E]" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 pt-8 pb-32 min-h-full">
      <div className="mb-8">
        <h1 className="font-fredoka text-3xl font-semibold mb-2 text-[#1B2A4A]">Expenses</h1>
        <p className="font-inter text-gray-500 text-sm">All logged expenses for the trip.</p>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center pt-16 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Receipt size={32} />
          </div>
          <p className="font-inter text-gray-500 mb-6">No expenses yet. Add the first one.</p>
          <Link href="/expenses/new" className="bg-[#FF6B5E] text-white px-6 py-2.5 rounded-full font-inter font-medium shadow-sm active:scale-95 transition-transform">
            Add Expense
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map(exp => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              payerName={people[exp.paid_by]?.name || "Unknown"}
              isCreator={exp.created_by === activePersonId}
              onDelete={() => handleDelete(exp.id)}
              onClick={() => router.push(`/expenses/${exp.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
