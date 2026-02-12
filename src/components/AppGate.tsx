"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "pp_app_token";

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}

export default function AppGate({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => getStoredToken(), []);
  const [token, setToken] = useState(initial);
  const [isFocused, setIsFocused] = useState(false);

  function save() {
    const t = token.trim();
    if (!t) return;
    localStorage.setItem(KEY, t);
    setToken(t);
  }

  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 bg-black text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10"
            >
              <Lock className="h-6 w-6 text-white/80" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight">Pocket Planner</h1>
            <p className="text-sm text-white/60">
              Type your access token.
            </p>
          </div>

          <div 
            className={cn(
              "group relative rounded-2xl bg-white/5 p-1 transition-all duration-300",
              isFocused ? "bg-white/10 ring-1 ring-white/20 scale-[1.02]" : "hover:bg-white/10"
            )}
          >
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full bg-transparent px-4 py-4 text-center text-lg font-medium tracking-widest text-white outline-none placeholder:text-white/20 placeholder:tracking-normal placeholder:text-sm"
              placeholder="Cole seu token aqui"
              autoCapitalize="none"
              autoCorrect="off"
            />
            
            <AnimatePresence>
              {token.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={save}
                  className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-xl bg-white text-black shadow-lg hover:bg-white/90 active:scale-95 transition-transform"
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white"
    >
      {children}
    </motion.div>
  );
}