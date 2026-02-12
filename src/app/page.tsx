"use client";

import Tabs from "@/components/Tabs";
import TodoTab from "@/components/TodoTab";
import RemindersTab from "@/components/RemindersTab";

export default function Home() {
  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <h1 className="text-xl font-semibold">Pocket Planner</h1>
      <p className="mt-1 text-sm opacity-80">
        Mobile-first to-do and reminders.
      </p>

      <div className="mt-5">
        <Tabs
          tabs={[
            { key: "todo", label: "To-Do", content: <TodoTab /> },
            { key: "reminders", label: "Reminders", content: <RemindersTab /> },
          ]}
        />
      </div>
    </main>
  );
}
