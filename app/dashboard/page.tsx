"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { calculateBalances } from "@/lib/balances";
import { FamilyBalanceCard } from "@/components/FamilyBalanceCard";
import { Family, Person, Expense, ExpenseSplit, Payment } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<{
    families: Family[];
    people: Person[];
    familyNet: Record<string, number>;
    familyPaidTotal: Record<string, number>;
    familyOwedTotal: Record<string, number>;
  } | null>(null);
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [f, p, e, es, pay] = await Promise.all([
        supabase.from("families").select("*"),
        supabase.from("people").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("expense_splits").select("*"),
        supabase.from("payments").select("*")
      ]);
      
      if (!f.data || !p.data) return;

      const balances = calculateBalances(
        f.data as Family[],
        p.data as Person[],
        e.data as Expense[] || [],
        es.data as ExpenseSplit[] || [],
        pay.data as Payment[] || []
      );

      const activePersonId = localStorage.getItem("active_person_id");
      let activeFamId = null;
      if (activePersonId && p.data) {
        const activePerson = (p.data as Person[]).find(person => person.id === activePersonId);
        if (activePerson) {
          activeFamId = activePerson.family_id;
        }
      }
      setActiveFamilyId(activeFamId);

      setData({
        families: f.data as Family[],
        people: p.data as Person[],
        familyNet: balances.familyNet,
        familyPaidTotal: balances.familyPaidTotal,
        familyOwedTotal: balances.familyOwedTotal
      });
    }
    load();
  }, []);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF6B5E]" size={32} />
      </div>
    );
  }

  const userFamily = data.families.find(f => f.id === activeFamilyId);
  const otherFamilies = [...data.families]
    .filter(f => f.id !== activeFamilyId)
    .sort((a, b) => {
      return data.familyNet[a.id] - data.familyNet[b.id];
    });

  return (
    <div className="p-6 pt-8 pb-32">
      <div className="mb-8">
        <h1 className="font-fredoka text-3xl font-semibold mb-2 text-[#1B2A4A]">Dashboard</h1>
        <p className="font-inter text-gray-500 text-sm">Your family&apos;s trip balance and overview of everyone else.</p>
      </div>

      {userFamily && (
        <div className="mb-8">
          <FamilyBalanceCard
            family={userFamily}
            paid={data.familyPaidTotal[userFamily.id] || 0}
            owed={data.familyOwedTotal[userFamily.id] || 0}
            net={data.familyNet[userFamily.id] || 0}
            isHighlighted
          />
        </div>
      )}

      <div>
        <h2 className="font-fredoka text-lg font-medium text-[#1B2A4A] mb-3">
          {userFamily ? "Other Families" : "All Families"}
        </h2>
        <div className="space-y-4">
          {otherFamilies.map(family => (
            <FamilyBalanceCard
              key={family.id}
              family={family}
              paid={data.familyPaidTotal[family.id] || 0}
              owed={data.familyOwedTotal[family.id] || 0}
              net={data.familyNet[family.id] || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
