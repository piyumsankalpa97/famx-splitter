"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import coverImage from "./cover-image.jpg";
import { Loader2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const activePersonId = localStorage.getItem("active_person_id");
    if (activePersonId) {
      router.replace("/dashboard");
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim()) {
      setError("Please enter your email.");
      setLoading(false);
      return;
    }

    const { data: people, error: dbError } = await supabase
      .from("people")
      .select("id, email")
      .ilike("email", email.trim());

    if (dbError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    if (people && people.length > 0) {
      const person = people[0];
      localStorage.setItem("active_person_id", person.id);
      router.push("/dashboard");
    } else {
      setError("Email not found. Are you sure you're on the trip?");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F7F9FC]">
      {/* Image Section */}
      <div className="relative w-full md:w-1/2 lg:w-[55%] h-64 md:h-screen">
        <Image 
          src={coverImage} 
          alt="Trip Cover" 
          fill 
          className="object-cover"
          priority
        />
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-start px-6 py-12 sm:px-12 lg:px-20 xl:px-24 bg-[#F7F9FC] md:bg-white md:shadow-[-20px_0_40px_rgba(0,0,0,0.05)] z-10 rounded-t-3xl md:rounded-none -mt-6 md:mt-0 relative">
        <div className="w-full max-w-md mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="font-fredoka text-4xl font-semibold text-[#1B2A4A] mb-3">
              Anu Pol Trip
            </h1>
            <div className="inline-block px-3 py-1 bg-[#FF6B5E]/10 border border-[#FF6B5E]/20 rounded-full mb-4">
              <span className="font-plex-mono text-[#FF6B5E] font-medium tracking-widest">2026</span>
            </div>
            <p className="font-inter text-gray-500 text-sm">
              Enter your email to access the trip dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-5 py-4 bg-white md:bg-[#F7F9FC] border border-gray-200 rounded-xl text-[#1B2A4A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B5E] focus:border-transparent transition-all font-inter shadow-sm md:shadow-none"
                required
              />
            </div>
            
            {error && (
              <p className="text-[#FF6B5E] text-sm font-inter animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-[#1B2A4A] hover:bg-[#2A3E6B] text-white rounded-xl font-semibold font-inter transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group shadow-lg shadow-[#1B2A4A]/20 mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
