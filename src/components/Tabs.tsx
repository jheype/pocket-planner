"use client";

import { useMemo, useState } from "react";

type Tab = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export default function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = useMemo(() => tabs.find((t) => t.key === active), [tabs, active]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={[
              "rounded-lg px-3 py-2 text-sm",
              active === t.key ? "bg-white/15" : "bg-transparent opacity-80",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">{current?.content}</div>
    </div>
  );
}
