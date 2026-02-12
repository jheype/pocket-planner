"use client";

import { useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Plus, Trash2, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  }, [tasks]);

  const remaining = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);

  async function load() {
    const res = await authedFetch("/api/tasks");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const json: { tasks?: Task[] } = await res.json();
    setTasks(json.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function add(e?: React.FormEvent) {
    e?.preventDefault();
    const t = title.trim();
    if (!t) return;

    const tempId = crypto.randomUUID();
    const newTask: Task = { id: tempId, title: t, done: false, createdAt: new Date().toISOString() };
    setTasks((prev) => [newTask, ...prev]);
    setTitle("");

    const res = await authedFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: t }),
    });

    if (!res.ok) {
      setTasks((prev) => prev.filter((x) => x.id !== tempId));
      return;
    }

    await load();
  }

  async function toggle(id: string, currentDone: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !currentDone } : t)));

    const res = await authedFetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ id, done: !currentDone }),
    });

    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: currentDone } : t)));
    }
  }

  async function remove(id: string) {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    const res = await authedFetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) setTasks(snapshot);
  }

  return (
    <section className="pb-24">
      <header className="mb-6 flex items-end justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-white/50">{loading ? "Syncing…" : `${remaining} tasks remaining`}</p>
        </div>
      </header>

      <form onSubmit={add} className="relative mb-8">
        <div className="relative flex items-center overflow-hidden rounded-2xl bg-white/10 p-1 ring-1 ring-white/10 transition-all focus-within:bg-white/15 focus-within:ring-white/30">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder:text-white/40 outline-none"
            placeholder="Add a new task…"
            autoCapitalize="sentences"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="mr-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {loading && tasks.length === 0 && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="py-10 text-center text-sm text-white/40">No tasks yet.</div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {sortedTasks.map((t) => (
            <TaskItem key={t.id} task={t} onToggle={() => toggle(t.id, t.done)} onRemove={() => void remove(t.id)} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}

function TaskItem({
  task,
  onToggle,
  onRemove,
}: {
  task: Task;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) onRemove();
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      whileTap={{ scale: 0.98 }}
      className="relative touch-pan-y"
    >
      <div className="absolute inset-0 flex items-center justify-end rounded-2xl bg-red-500/20 px-4">
        <Trash2 className="h-5 w-5 text-red-400" />
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.5, right: 0.05 }}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative flex items-center gap-4 rounded-2xl border border-white/5 bg-[#121212] p-4 shadow-sm",
          task.done ? "opacity-60" : "opacity-100"
        )}
        style={{ x: 0 }}
      >
        <button
          onClick={onToggle}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
            task.done ? "border-green-500 bg-green-500 text-black" : "border-white/30 bg-transparent hover:border-white"
          )}
        >
          {task.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        <span
          className={cn(
            "flex-1 select-none truncate text-base",
            task.done && "text-white/40 line-through decoration-white/20"
          )}
        >
          {task.title}
        </span>

        <div className="h-8 w-1 rounded-full bg-white/5" />
      </motion.div>
    </motion.li>
  );
}
