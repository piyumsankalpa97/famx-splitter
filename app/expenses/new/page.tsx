"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Family, Person } from "@/lib/types";
import { Loader2, Image as ImageIcon, X } from "lucide-react";

export default function AddExpense() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [note, setNote] = useState("");
  const [splitToAll, setSplitToAll] = useState(true);
  const [selectedSplitIds, setSelectedSplitIds] = useState<Set<string>>(new Set());
  type CustomSplitType = 'lkr' | 'percent';
  const [customSplits, setCustomSplits] = useState<Record<string, { type: CustomSplitType, value: string }>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  useEffect(() => {
    const activeId = localStorage.getItem("active_person_id");
    setActivePersonId(activeId);
    if (activeId) {
      setPaidBy(activeId);
    }

    async function load() {
      const [fRes, pRes] = await Promise.all([
        supabase.from("families").select("*"),
        supabase.from("people").select("*")
      ]);
      if (fRes.data) setFamilies(fRes.data as Family[]);
      if (pRes.data) {
        setPeople(pRes.data as Person[]);
        setSelectedSplitIds(new Set());
      }
      setLoading(false);
    }
    load();
  }, []);

  const togglePersonSplit = (id: string) => {
    const next = new Set(selectedSplitIds);
    if (next.has(id)) {
      next.delete(id);
      setCustomSplits(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } else {
      next.add(id);
    }
    setSelectedSplitIds(next);
  };

  const updateCustomSplit = (id: string, type: CustomSplitType, value: string) => {
    setCustomSplits(prev => ({
      ...prev,
      [id]: { type, value }
    }));
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!title || !amount || !paidBy || !activePersonId) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const memberIds = splitToAll ? people.map(p => p.id) : Array.from(selectedSplitIds);
    if (memberIds.length === 0) return;

    let totalCustomAmount = 0;
    const finalSplits = new Map<string, number>();
    let emptyMembersCount = 0;

    if (!splitToAll) {
      for (const id of memberIds) {
        const split = customSplits[id];
        if (!split || !split.value) {
          emptyMembersCount++;
          continue;
        }

        const val = parseFloat(split.value);
        if (isNaN(val) || val < 0) continue;
        
        let calculatedAmt = 0;
        if (split.type === 'lkr') {
          calculatedAmt = val;
        } else {
          calculatedAmt = (val / 100) * numAmount;
        }
        
        calculatedAmt = Math.round(calculatedAmt * 100) / 100;
        totalCustomAmount += calculatedAmt;
        finalSplits.set(id, calculatedAmt);
      }

      totalCustomAmount = Math.round(totalCustomAmount * 100) / 100;
      
      if (totalCustomAmount > numAmount) {
        setErrorMsg("Custom splits exceed the total expense amount.");
        return;
      }
      
      if (totalCustomAmount === numAmount && emptyMembersCount > 0) {
        setErrorMsg("No remaining amount left for members without custom values. Please unselect them or adjust the values.");
        return;
      }
      
      if (totalCustomAmount < numAmount && emptyMembersCount === 0) {
        const rem = Math.round((numAmount - totalCustomAmount) * 100) / 100;
        setErrorMsg(`You must allocate the full amount. There is still Rs.${rem} remaining.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      let imageUrl = null;
      if (image) {
        const ext = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        // Uploading into a 'public' folder as required by your RLS policy
        const filePath = `public/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('anu-pol-trip')
          .upload(filePath, image);
          
        if (uploadError) {
          console.error("Upload error", uploadError);
          setErrorMsg("Failed to upload image. Please try again.");
          setSubmitting(false);
          return;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('anu-pol-trip')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrlData.publicUrl;
      }

      // Create Expense
      const { data: expData, error: expErr } = await supabase.from("expenses").insert({
        title,
        amount: numAmount,
        paid_by: paidBy,
        created_by: activePersonId,
        occurred_at: new Date().toISOString(),
        note: note || null,
        image_url: imageUrl
      }).select().single();

      if (expErr || !expData) throw expErr;

      // Calculate Splits
      const splitsToInsert = [];
      const memberCount = memberIds.length;
      
      if (splitToAll) {
        const shareAmount = Math.round((numAmount / memberCount) * 100) / 100;
        for (const personId of memberIds) {
          splitsToInsert.push({
            expense_id: expData.id,
            person_id: personId,
            share_amount: shareAmount
          });
        }
      } else {
        const remainingAmount = Math.round((numAmount - totalCustomAmount) * 100) / 100;
        const shareAmount = emptyMembersCount > 0 ? Math.round((remainingAmount / emptyMembersCount) * 100) / 100 : 0;
        
        for (const personId of memberIds) {
          const share = finalSplits.has(personId) ? finalSplits.get(personId)! : shareAmount;
          splitsToInsert.push({
            expense_id: expData.id,
            person_id: personId,
            share_amount: share
          });
        }
      }

      // Find the payer in the splits list to apply remainder, if any
      const currentTotal = splitsToInsert.reduce((sum, s) => sum + s.share_amount, 0);
      const remainder = Math.round((numAmount - currentTotal) * 100) / 100;

      if (Math.abs(remainder) > 0.001) {
        const payerSplitIndex = splitsToInsert.findIndex(s => s.person_id === paidBy);
        if (payerSplitIndex !== -1) {
          splitsToInsert[payerSplitIndex].share_amount = Math.round((splitsToInsert[payerSplitIndex].share_amount + remainder) * 100) / 100;
        } else {
          splitsToInsert[0].share_amount = Math.round((splitsToInsert[0].share_amount + remainder) * 100) / 100;
        }
      }

      await supabase.from("expense_splits").insert(splitsToInsert);
      
      // Reset form state so it's clean if the user navigates back to this page
      setTitle("");
      setAmount("");
      setNote("");
      setImage(null);
      setImagePreview(null);
      setSplitToAll(true);
      setCustomSplits({});
      setSelectedSplitIds(new Set());
      setSubmitting(false);
      
      router.push("/expenses");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to add expense");
      setSubmitting(false);
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
      <div className="mb-6">
        <h1 className="font-fredoka text-3xl font-semibold mb-2 text-[#1B2A4A]">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What was it for?</label>
            <input
              required
              type="text"
              placeholder="e.g., 1st Day lunch"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full font-inter text-[#1B2A4A] bg-transparent border-b border-gray-200 pb-2 focus:border-[#FF6B5E] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amount (Rs.)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full font-plex-mono text-2xl text-[#1B2A4A] bg-transparent border-b border-gray-200 pb-2 focus:border-[#FF6B5E] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Who paid?</label>
            <select
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
              className="w-full font-inter text-[#1B2A4A] bg-transparent border-b border-gray-200 pb-2 focus:border-[#FF6B5E] focus:outline-none transition-colors"
            >
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Note (Optional)</label>
            <input
              type="text"
              placeholder="Any details..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full font-inter text-[#1B2A4A] bg-transparent border-b border-gray-200 pb-2 focus:border-[#FF6B5E] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Receipt / Image (Optional)</label>
            {!imagePreview ? (
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#FF6B5E] cursor-pointer transition-colors">
                <div className="flex flex-col items-center text-gray-400">
                  <ImageIcon size={24} className="mb-2" />
                  <span className="text-sm font-medium">Click to upload image</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full max-h-[200px] object-cover" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Split between</label>
          
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setSplitToAll(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${splitToAll ? 'bg-[#FF6B5E] text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}
            >
              Everyone ({people.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSplitToAll(false);
                setErrorMsg("");
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!splitToAll ? 'bg-[#FF6B5E] text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}
            >
              Custom
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          {!splitToAll && (
            <div className="space-y-3 mt-4">
              {families.map(f => {
                const famPeeps = people.filter(p => p.family_id === f.id);
                if (famPeeps.length === 0) return null;
                return (
                  <div key={f.id} className="space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{f.name}</div>
                    {famPeeps.map(p => {
                      const isSelected = selectedSplitIds.has(p.id);
                      const customVal = customSplits[p.id] || { type: 'lkr', value: '' };
                      
                      return (
                        <div key={p.id} className={`flex flex-col p-3 rounded-xl border transition-all ${isSelected ? 'border-[#FF6B5E] bg-[#FF6B5E]/5' : 'border-gray-100 bg-white opacity-60'}`}>
                          <button
                            type="button"
                            onClick={() => togglePersonSplit(p.id)}
                            className="w-full flex items-center justify-between"
                          >
                            <span className={`font-inter text-sm ${isSelected ? 'text-[#1B2A4A] font-medium' : 'text-gray-500'}`}>{p.name}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#FF6B5E] bg-[#FF6B5E]' : 'border-gray-300'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </button>
                          
                          {isSelected && (
                            <div className="mt-3 flex items-center gap-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder={`Custom amount (${customVal.type === 'lkr' ? 'Rs.' : '%'})`}
                                value={customVal.value}
                                onChange={(e) => updateCustomSplit(p.id, customVal.type, e.target.value)}
                                className="flex-1 w-0 font-plex-mono text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:border-[#FF6B5E] focus:outline-none transition-colors"
                              />
                              <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateCustomSplit(p.id, 'lkr', customVal.value)}
                                  className={`px-3 py-2 text-xs font-semibold transition-colors ${customVal.type === 'lkr' ? 'bg-gray-100 text-[#1B2A4A]' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                  LKR
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateCustomSplit(p.id, 'percent', customVal.value)}
                                  className={`px-3 py-2 text-xs font-semibold transition-colors ${customVal.type === 'percent' ? 'bg-gray-100 text-[#1B2A4A]' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                  %
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#1B2A4A] text-white p-4 rounded-xl font-inter font-semibold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center"
        >
          {submitting ? <Loader2 className="animate-spin" size={20} /> : "Save Expense"}
        </button>
      </form>
    </div>
  );
}
