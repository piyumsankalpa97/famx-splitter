"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function IdentityHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // We only fetch if on client
    const loadUser = async () => {
      const storedId = localStorage.getItem("active_person_id");
      if (storedId) {
        const { data } = await supabase.from("people").select("name").eq("id", storedId).single();
        if (data) {
          setUserName(data.name);
        }
      }
    };
    loadUser();
  }, [pathname]);

  // Don't show header on the identity picker page itself
  if (pathname === "/") return null;

  return (
    <header className="px-6 py-4 flex justify-between items-center bg-[#FF6B5E] z-40 sticky top-0 shadow-sm">
      <h1 className="font-fredoka text-xl font-semibold text-white">Anu Pol Trip</h1>
      <Link 
        href="/" 
        onClick={() => {
          localStorage.removeItem("active_person_id");
          setUserName(null);
        }}
        className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-inter font-medium text-gray-600">
          {userName || "Who are you?"}
        </span>
        <UserCircle size={18} className="text-[#FF6B5E]" />
      </Link>
    </header>
  );
}
