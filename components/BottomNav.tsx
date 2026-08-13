"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ReceiptText, PlusCircle, Handshake } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  
  if (pathname === "/") return null;

  return (
    <nav className="absolute bottom-0 w-full max-w-[430px] bg-white border-t border-gray-100 px-6 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname.startsWith('/dashboard') ? 'text-[#1B2A4A]' : 'text-gray-400 hover:text-[#1B2A4A]'}`}>
        <Home size={24} />
        <span className="text-[10px] font-medium font-inter">Home</span>
      </Link>
      <Link href="/expenses" className={`flex flex-col items-center gap-1 ${pathname === '/expenses' ? 'text-[#1B2A4A]' : 'text-gray-400 hover:text-[#1B2A4A]'}`}>
        <ReceiptText size={24} />
        <span className="text-[10px] font-medium font-inter">Expenses</span>
      </Link>
      
      <Link href="/settle" className={`flex flex-col items-center gap-1 ${pathname === '/settle' ? 'text-[#1B2A4A]' : 'text-gray-400 hover:text-[#1B2A4A]'}`}>
        <Handshake size={24} />
        <span className="text-[10px] font-medium font-inter">Settle</span>
      </Link>

      <Link href="/expenses/new" className="relative -top-5 bg-[#FF6B5E] text-white p-4 rounded-full shadow-lg shadow-[#FF6B5E]/30 transform hover:scale-105 transition-transform">
        <PlusCircle size={28} />
      </Link>
    </nav>
  );
}
