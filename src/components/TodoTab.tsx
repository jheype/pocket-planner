"use client";

import { useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";

type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

export default function TodoTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const remaining = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);

  async function load() {
    setLoading(true);
    const res = await authedFetch("/api/tasks");
    const json = await res.json();
    setTasks(json.tasks ?? []);
    setLoading(false);
  }

    useEffect(() => {
    void (async () => {
        await load();
    })();
    }, []);

  async function add() {
    const t = title.trim();
    if (!t) return;

    setTitle("");
    const res = await authedFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: t }),
    });

    if (res.ok) await load();
  }

  async function toggle(id: string, done: boolean) {
    const res = await authedFetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ id, done: !done }),
    });

    if (res.ok) await load();
  }

  async function remove(id: string) {
    const res = await authedFetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (res.ok) await load();
  }

  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold">To-Do</h2>
          <p className="mt-1 text-xs opacity-80">
            {loading ? "Loading…" : `${remaining} remaining`}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <label className="text-xs opacity-80">Add a task</label>
        <div className="mt-2 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            placeholder="e.g. Reply to emails"
            autoCapitalize="sentences"
          />
          <button
            onClick={add}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {!loading && tasks.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm opacity-80">
            No tasks yet. Add one to get started.
          </div>
        )}

        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <button
              onClick={() => toggle(t.id, t.done)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className={[
                  "h-5 w-5 rounded-md border border-white/20",
                  t.done ? "bg-white/20" : "bg-transparent",
                ].join(" ")}
              />
              <span
                className={[
                  "truncate text-sm",
                  t.done ? "opacity-50 line-through" : "",
                ].join(" ")}
              >
                {t.title}
              </span>
            </button>

            <button
              onClick={() => remove(t.id)}
              className="rounded-lg bg-white/10 px-3 py-2 text-xs"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
