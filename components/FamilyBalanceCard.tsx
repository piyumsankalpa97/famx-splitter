import { Family } from "@/lib/types";

const FAMILY_COLORS: Record<string, string> = {
  "Family A": "#FFD9CE",
  "Family B": "#CDEAE5",
  "Family C": "#FFEFB0",
  "Family D": "#D8E2FF",
  "Family E": "#E6D9FF",
};

interface Props {
  family: Family;
  paid: number;
  owed: number;
  net: number;
  isHighlighted?: boolean;
}

export function FamilyBalanceCard({ family, paid, owed, net, isHighlighted }: Props) {
  const bgColor = FAMILY_COLORS[family.name] || "#FFF";
  const isOwed = net > 0.01;
  const inDebt = net < -0.01;

  if (isHighlighted) {
    return (
      <div className="relative p-6 sm:p-8 rounded-[2rem] shadow-xl overflow-hidden transition-transform hover:scale-[1.01] bg-[#1B2A4A] text-white">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-[#FF6B5E] to-[#FF8E75] rounded-full blur-2xl opacity-40 mix-blend-screen" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-[#4CB8A0] to-[#5ED5B8] rounded-full blur-2xl opacity-20 mix-blend-screen" />
        <div className="absolute inset-0 border border-white/10 rounded-[2rem] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-4 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-[#FF6B5E] animate-pulse" />
              <span className="font-inter text-xs font-medium tracking-wide">Your Family</span>
            </div>
            
            <h3 className="font-fredoka text-3xl font-semibold mb-6">{family.name}</h3>
            
            <div className="flex gap-8 font-inter text-sm">
              <div>
                <span className="block text-xs uppercase tracking-wider text-white/60 mb-1">Total Paid</span>
                <span className="font-plex-mono font-medium text-xl">{paid.toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-wider text-white/60 mb-1">Your Share</span>
                <span className="font-plex-mono font-medium text-xl">{owed.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="sm:text-right bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
            <span className="block font-inter text-xs uppercase tracking-wider text-white/60 mb-2">Net Balance</span>
            <div className={`font-plex-mono font-bold text-3xl sm:text-4xl ${
              isOwed ? "text-[#4CB8A0]" : inDebt ? "text-[#FF6B5E]" : "text-white/80"
            }`}>
              {isOwed ? "+" : inDebt ? "-" : ""} Rs {Math.abs(net).toFixed(2)}
            </div>
            <div className="font-inter text-xs font-medium mt-2 uppercase tracking-wide text-white/80">
              {isOwed ? "You get back" : inDebt ? "You owe" : "All settled up"}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="relative flex items-center p-5 rounded-2xl shadow-sm border border-black/5 overflow-hidden transition-transform hover:scale-[1.01]"
      style={{ backgroundColor: bgColor }}
    >
      {/* Luggage tag hole */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#F7F9FC] rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-black/5" />
      {/* Luggage tag loop fake string */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-4 h-[2px] bg-[#1B2A4A]/20" />
      
      <div className="pl-6 flex-1">
        <h3 className="font-fredoka text-xl font-medium text-[#1B2A4A]">{family.name}</h3>
        <div className="flex gap-5 mt-2.5 font-inter text-xs text-[#1B2A4A]/80">
          <div>
            <span className="block text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Paid</span>
            <span className="font-plex-mono font-medium">{paid.toFixed(2)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider opacity-60 mb-0.5">Share</span>
            <span className="font-plex-mono font-medium">{owed.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right pl-3">
        <span className="block font-inter text-[10px] uppercase tracking-wider opacity-60 mb-1">Net Balance</span>
        <div className={`font-plex-mono font-semibold text-lg ${
          isOwed ? "text-[#4CB8A0]" : inDebt ? "text-[#FF6B5E]" : "text-[#1B2A4A]/50"
        }`}>
          {isOwed ? "+" : inDebt ? "-" : ""} {Math.abs(net).toFixed(2)}
        </div>
        <div className="font-inter text-[10px] font-medium mt-1 uppercase tracking-wide">
          {isOwed ? "Gets back" : inDebt ? "Owes" : "Settled"}
        </div>
      </div>
    </div>
  );
}
