"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { calculateBalances } from "@/lib/balances";
import { calculateSettleTransactions, Transaction } from "@/lib/settleAlgorithm";
import { Family, Person, Expense, ExpenseSplit, Payment } from "@/lib/types";
import { SettleTransactionRow } from "@/components/SettleTransactionRow";
import { Loader2, Handshake } from "lucide-react";

export default function SettleUp() {
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pastPayments, setPastPayments] = useState<Payment[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [f, p, e, es, pay] = await Promise.all([
      supabase.from("families").select("*"),
      supabase.from("people").select("*"),
      supabase.from("expenses").select("*"),
      supabase.from("expense_splits").select("*"),
      supabase.from("payments").select("*").order("paid_at", { ascending: false })
    ]);
    
    if (f.data) {
      const fMap: Record<string, string> = {};
      (f.data as Family[]).forEach(fam => {
        fMap[fam.id] = fam.name;
      });
      setFamilies(fMap);
    }
    
    if (pay.data) setPastPayments(pay.data as Payment[]);

    if (f.data && p.data) {
      const balances = calculateBalances(
        f.data as Family[],
        p.data as Person[],
        (e.data as Expense[]) || [],
        (es.data as ExpenseSplit[]) || [],
        (pay.data as Payment[]) || []
      );

      const settleTx = calculateSettleTransactions(balances.familyNet);
      setTransactions(settleTx);
    }
    
    setLoading(false);
  }

  const handleMarkPaid = async (tx: Transaction, amount: number) => {
    const { data, error } = await supabase.from("payments").insert({
      from_family_id: tx.from_family_id,
      to_family_id: tx.to_family_id,
      amount,
      note: "Settled via app",
      paid_at: new Date().toISOString()
    }).select().single();

    if (error) throw error;
    
    // We add the payment to the past payments list optimistically so it shows up at the bottom
    if (data) {
      setPastPayments(prev => [data as Payment, ...prev]);
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
    <div className="p-6 pt-8 pb-32">
      <div className="mb-8">
        <h1 className="font-fredoka text-3xl font-semibold mb-2 text-[#1B2A4A]">Settle Up</h1>
        <p className="font-inter text-gray-500 text-sm">Suggested transfers to make all balances zero.</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center pt-12 flex flex-col items-center mb-12">
          <div className="w-16 h-16 bg-[#4CB8A0]/10 rounded-full flex items-center justify-center mb-4 text-[#4CB8A0]">
            <Handshake size={32} />
          </div>
          <h2 className="font-fredoka text-xl font-medium text-[#1B2A4A] mb-2">All settled up!</h2>
          <p className="font-inter text-gray-500 text-sm max-w-[80%]">No one owes anything. Balances are perfectly even.</p>
        </div>
      ) : (
        <div className="mb-12">
          {transactions.map((tx, idx) => (
            <SettleTransactionRow
              key={`${tx.from_family_id}-${tx.to_family_id}-${idx}`}
              transaction={{
                ...tx,
                fromName: families[tx.from_family_id],
                toName: families[tx.to_family_id],
              }}
              onMarkPaid={(amt) => handleMarkPaid(tx, amt)}
            />
          ))}
        </div>
      )}

      {pastPayments.length > 0 && (
        <div>
          <h3 className="font-fredoka text-sm text-gray-400 uppercase tracking-wider mb-4 pl-1">Past Payments</h3>
          <div className="space-y-3">
            {pastPayments.map(p => {
              const date = new Date(p.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={p.id} className="flex justify-between items-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm opacity-80">
                  <div>
                    <div className="text-sm font-inter text-[#1B2A4A] font-medium flex items-center gap-1.5">
                      {families[p.from_family_id]}
                      <span className="text-gray-300 text-[10px]">&rarr;</span>
                      {families[p.to_family_id]}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide font-medium">{date} &middot; {p.note}</div>
                  </div>
                  <div className="font-plex-mono text-sm font-semibold text-gray-600">
                    Rs. {Number(p.amount).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
