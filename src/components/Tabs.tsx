"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tab = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-black/80 p-1 backdrop-blur-xl">
        <div className="grid grid-cols-2 rounded-2xl bg-white/5 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={cn(
                "relative z-10 py-2.5 text-sm font-medium transition-colors duration-200",
                active === t.key ? "text-black" : "text-white/60 hover:text-white"
              )}
            >
              {active === t.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 -z-10 rounded-xl bg-white shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {current?.content}
        </motion.div>
      </div>
    </div>
  );
}