import { Expense } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface Props {
  expense: Expense;
  payerName: string;
  isCreator?: boolean;
  onDelete?: () => void;
  onClick?: () => void;
}

export function ExpenseCard({ expense, payerName, isCreator, onDelete, onClick }: Props) {
  const dateObj = new Date(expense.occurred_at);
  const date = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-hidden group ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      {/* Notches for ticket stub */}
      <div className="absolute top-0 bottom-0 left-[70%] w-px border-l-2 border-dashed border-gray-200" />
      <div className="absolute -top-2 left-[70%] -translate-x-1/2 w-4 h-4 bg-[#F7F9FC] rounded-full border border-gray-100 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.02)]" />
      <div className="absolute -bottom-2 left-[70%] -translate-x-1/2 w-4 h-4 bg-[#F7F9FC] rounded-full border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
      
      <div className="flex-[70%] min-w-0 p-4 pr-6 flex flex-col justify-between">
        <div>
          <h3 className="font-fredoka text-lg font-medium text-[#1B2A4A] truncate pr-2">{expense.title}</h3>
          <div className="flex items-center gap-2 mt-1.5 font-inter text-xs text-gray-500">
            <span className="font-medium text-gray-700 truncate">{payerName}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
            <span className="shrink-0">{date}, {time}</span>
          </div>
          {expense.note && (
            <p className="mt-2 text-xs text-gray-400 italic truncate">{expense.note}</p>
          )}
        </div>
        
        {isCreator && (
          <div className="flex gap-3 mt-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }} 
              className="text-gray-400 hover:text-[#FF6B5E] transition-colors flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex-[30%] p-4 flex flex-col justify-center items-end bg-gray-50/50">
        <span className="block font-inter text-[9px] uppercase tracking-widest text-gray-400 mb-1">Amount</span>
        <span className="font-plex-mono font-semibold text-[#1B2A4A]">
          {Number(expense.amount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
