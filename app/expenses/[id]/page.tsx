"use client";

import { useEffect, useState, use, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Expense, ExpenseSplit, Person } from "@/lib/types";
import { Loader2, ArrowLeft, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

function ExpenseDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [expense, setExpense] = useState<Expense | null>(null);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [eRes, sRes, pRes] = await Promise.all([
        supabase.from("expenses").select("*").eq("id", id).single(),
        supabase.from("expense_splits").select("*").eq("expense_id", id),
        supabase.from("people").select("*")
      ]);
      
      if (eRes.data) setExpense(eRes.data as Expense);
      if (sRes.data) setSplits(sRes.data as ExpenseSplit[]);
      
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
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#FF6B5E]" size={32} />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-6 pt-8 text-center min-h-screen">
        <p>Expense not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-[#FF6B5E] font-medium">Go Back</button>
      </div>
    );
  }

  const dateObj = new Date(expense.occurred_at);
  const date = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const time = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const payerName = people[expense.paid_by]?.name || "Unknown";

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-32">
      {/* Mobile-like Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-fredoka text-xl font-medium text-[#1B2A4A] flex-1">Expense Details</h1>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-[#FF6B5E]/10 rounded-full flex items-center justify-center text-[#FF6B5E]">
              <Receipt size={24} />
            </div>
            <div className="text-right">
              <div className="font-plex-mono text-3xl font-bold text-[#FF6B5E]">
                {Number(expense.amount).toFixed(2)}
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-[#1B2A4A] mb-4 font-fredoka">{expense.title}</h2>
          
          <div className="flex flex-col gap-3 text-sm font-inter">
            <div className="flex justify-between border-b border-gray-50 pb-3">
              <span className="text-gray-500">Paid by</span>
              <span className="font-medium text-[#1B2A4A]">{payerName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-3">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-[#1B2A4A]">{date} at {time}</span>
            </div>
            {expense.note && (
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-gray-500">Note</span>
                <span className="text-gray-700 italic bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">{expense.note}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-fredoka text-lg font-medium text-[#1B2A4A] mb-4">Splits</h3>
          
          {splits.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-4">No splits found.</p>
          ) : (
            <div className="space-y-3">
              {splits.map(split => (
                <div key={split.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/5 flex items-center justify-center text-[#1B2A4A] font-medium text-xs">
                      {(people[split.person_id]?.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-700">
                      {people[split.person_id]?.name || "Unknown"}
                    </span>
                  </div>
                  <span className="font-plex-mono font-medium text-[#1B2A4A]">
                    {Number(split.share_amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-[#FF6B5E]" size={32} />
      </div>
    }>
      <ExpenseDetailContent params={params} />
    </Suspense>
  );
}
