"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, X } from "lucide-react";

interface Props {
  transaction: {
    from_family_id: string;
    to_family_id: string;
    amount: number;
    fromName: string;
    toName: string;
  };
  onMarkPaid: (amount: number) => Promise<void>;
}

export function SettleTransactionRow({ transaction, onMarkPaid }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "paid" | "collapsing">("idle");
  const [showModal, setShowModal] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState(transaction.amount.toString());

  const handleConfirm = async () => {
    const amountToPay = isCustom ? parseFloat(customAmount) : transaction.amount;
    if (isNaN(amountToPay) || amountToPay <= 0) return;

    setShowModal(false);
    setStatus("loading");
    try {
      await onMarkPaid(amountToPay);
      setStatus("paid");
      setTimeout(() => {
        setStatus("collapsing");
      }, 1000); // show check for 1000ms before collapsing
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  };

  const openModal = () => {
    setCustomAmount(transaction.amount.toString());
    setIsCustom(false);
    setShowModal(true);
  };

  return (
    <>
      <AnimatePresence>
        {status !== "collapsing" && (
          <motion.div
            initial={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between"
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 font-inter text-[#1B2A4A] text-sm font-medium mb-1">
                <span className="truncate max-w-[40%]">{transaction.fromName}</span>
                <ArrowRight size={14} className="text-[#FF6B5E] shrink-0 opacity-70" />
                <span className="truncate max-w-[40%]">{transaction.toName}</span>
              </div>
              <div className="font-plex-mono font-semibold text-lg text-[#1B2A4A]">
                Rs. {transaction.amount.toFixed(2)}
              </div>
            </div>

            <button
              onClick={openModal}
              disabled={status !== "idle"}
              className={`shrink-0 flex justify-center items-center h-10 min-w-[100px] px-4 rounded-lg font-inter text-xs font-semibold uppercase tracking-wider transition-all shadow-sm ${
                status === "paid" ? "bg-[#4CB8A0] text-white" : "bg-[#FFC857] text-[#1B2A4A] hover:bg-[#e6b44e] active:scale-95"
              } disabled:opacity-90 disabled:active:scale-100`}
            >
              {status === "loading" ? (
                <span className="w-4 h-4 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin" />
              ) : status === "paid" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Check size={18} strokeWidth={3} />
                </motion.div>
              ) : (
                "Mark Paid"
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#1B2A4A]/40 backdrop-blur-sm z-[100]"
              onClick={() => setShowModal(false)}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl p-6 pointer-events-auto"
              >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-fredoka text-2xl font-semibold text-[#1B2A4A]">Confirm Payment</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-2">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-[#F7F9FC] rounded-2xl p-5 mb-6 text-center border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment From &rarr; To</div>
                <div className="font-inter text-[#1B2A4A] font-medium flex items-center justify-center gap-2 mb-4">
                  <span>{transaction.fromName}</span>
                  <ArrowRight size={16} className="text-[#FF6B5E]" />
                  <span>{transaction.toName}</span>
                </div>

                {!isCustom ? (
                  <div>
                    <div className="font-plex-mono font-bold text-3xl text-[#1B2A4A]">
                      Rs. {transaction.amount.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => setIsCustom(true)}
                      className="mt-4 text-xs font-semibold text-[#FF6B5E] hover:text-[#e85a4f] underline underline-offset-4 transition-colors"
                    >
                      Pay a different amount?
                    </button>
                  </div>
                ) : (
                  <div className="text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Amount (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      autoFocus
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full font-plex-mono font-semibold text-2xl text-[#1B2A4A] bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-[#FF6B5E] focus:ring-2 focus:ring-[#FF6B5E]/20 outline-none transition-all shadow-sm"
                    />
                    <button 
                      onClick={() => {
                        setIsCustom(false);
                        setCustomAmount(transaction.amount.toString());
                      }}
                      className="mt-3 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancel custom amount
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 rounded-xl font-inter font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-4 rounded-xl font-inter font-semibold text-white bg-[#4CB8A0] shadow-[0_8px_16px_rgba(76,184,160,0.3)] hover:bg-[#3ea08a] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={18} strokeWidth={3} /> Confirm
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
