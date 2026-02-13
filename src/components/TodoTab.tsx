"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { authedFetch } from "@/lib/authedFetch";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  Code2,
  Dumbbell,
  Heart,
  Home,
  Lightbulb,
  Loader2,
  Palette,
  Plane,
  Plus,
  ShoppingCart,
  Sparkles,
  Target,
  Trash2,
  Users,
  Wrench,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

const LS_CATEGORIES = "todo.categories.v1";
const LS_TASK_CATEGORY = "todo.taskCategory.v1";
const LS_CATEGORY_OPEN = "todo.categoryOpen.v1";

type IconKey =
  | "briefcase"
  | "home"
  | "dumbbell"
  | "calendar"
  | "shopping"
  | "heart"
  | "plane"
  | "code"
  | "palette"
  | "wrench"
  | "target"
  | "ideas"
  | "people"
  | "sparkles";

type Category = {
  id: string;
  name: string;
  colour: string;
  icon: IconKey;
  createdAt: string;
};

const ICONS: Record<IconKey, (props: { className?: string }) => ReactElement> = {
  briefcase: (p) => <Briefcase className={p.className} />,
  home: (p) => <Home className={p.className} />,
  dumbbell: (p) => <Dumbbell className={p.className} />,
  calendar: (p) => <CalendarDays className={p.className} />,
  shopping: (p) => <ShoppingCart className={p.className} />,
  heart: (p) => <Heart className={p.className} />,
  plane: (p) => <Plane className={p.className} />,
  code: (p) => <Code2 className={p.className} />,
  palette: (p) => <Palette className={p.className} />,
  wrench: (p) => <Wrench className={p.className} />,
  target: (p) => <Target className={p.className} />,
  ideas: (p) => <Lightbulb className={p.className} />,
  people: (p) => <Users className={p.className} />,
  sparkles: (p) => <Sparkles className={p.className} />,
};

const ICON_PRESETS: Array<{ key: IconKey; label: string }> = [
  { key: "briefcase", label: "Work" },
  { key: "home", label: "Home" },
  { key: "dumbbell", label: "Training" },
  { key: "calendar", label: "Schedule" },
  { key: "shopping", label: "Shopping" },
  { key: "heart", label: "Health" },
  { key: "plane", label: "Travel" },
  { key: "code", label: "Build" },
  { key: "palette", label: "Design" },
  { key: "wrench", label: "Fix" },
  { key: "target", label: "Goals" },
  { key: "ideas", label: "Ideas" },
  { key: "people", label: "People" },
  { key: "sparkles", label: "Personal" },
];

const COLOUR_PRESETS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#fb7185",
  "#22d3ee",
  "#f97316",
  "#e5e7eb",
];

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normName(v: string) {
  return v.trim().replace(/\s+/g, " ").slice(0, 40);
}

export default function TodoTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [taskCategory, setTaskCategory] = useState<Record<string, string>>({});
  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>({});

  const [newCatName, setNewCatName] = useState("");
  const [newCatColour, setNewCatColour] = useState(COLOUR_PRESETS[0] ?? "#60a5fa");
  const [newCatIcon, setNewCatIcon] = useState<IconKey>("briefcase");

  const [draftByCategory, setDraftByCategory] = useState<Record<string, string>>({});
  const [moveModalTaskId, setMoveModalTaskId] = useState<string | null>(null);

  const remaining = useMemo(() => tasks.filter((t) => !t.done).length, [tasks]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  }, [tasks]);

  const categoriesWithSystem = useMemo(() => {
    const uncategorised: Category = {
      id: "uncategorised",
      name: "Uncategorised",
      colour: "#9ca3af",
      icon: "target",
      createdAt: "",
    };
    const list = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    return [uncategorised, ...list];
  }, [categories]);

  const grouped = useMemo(() => {
    const byId: Record<string, Task[]> = {};
    for (const t of sortedTasks) {
      const catId = taskCategory[t.id] || "uncategorised";
      (byId[catId] ??= []).push(t);
    }
    return byId;
  }, [sortedTasks, taskCategory]);

  const moveTaskTarget = useMemo(() => {
    if (!moveModalTaskId) return null;
    return tasks.find((t) => t.id === moveModalTaskId) ?? null;
  }, [moveModalTaskId, tasks]);

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
    void load();
  }, []);

  useEffect(() => {
    const cats = safeParseJson<Category[]>(localStorage.getItem(LS_CATEGORIES)) ?? [];
    const map = safeParseJson<Record<string, string>>(localStorage.getItem(LS_TASK_CATEGORY)) ?? {};
    const open = safeParseJson<Record<string, boolean>>(localStorage.getItem(LS_CATEGORY_OPEN)) ?? {};
    setCategories(cats);
    setTaskCategory(map);
    setCategoryOpen({ uncategorised: true, ...open });
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(LS_TASK_CATEGORY, JSON.stringify(taskCategory));
  }, [taskCategory]);

  useEffect(() => {
    const next = { ...categoryOpen };
    delete next.uncategorised;
    localStorage.setItem(LS_CATEGORY_OPEN, JSON.stringify(next));
  }, [categoryOpen]);

  function toggleOpen(categoryId: string) {
    setCategoryOpen((prev) => ({ ...prev, [categoryId]: !(prev[categoryId] ?? false) }));
  }

  function createCategory(e?: React.FormEvent) {
    e?.preventDefault();
    const name = normName(newCatName);
    if (!name) return;

    const cat: Category = {
      id: crypto.randomUUID(),
      name,
      colour: newCatColour,
      icon: newCatIcon,
      createdAt: new Date().toISOString(),
    };

    setCategories((prev) => [cat, ...prev]);
    setCategoryOpen((prev) => ({ ...prev, [cat.id]: true }));
    setNewCatName("");
  }

  function deleteCategory(categoryId: string) {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));

    setCategoryOpen((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });

    setTaskCategory((prev) => {
      const next: Record<string, string> = {};
      for (const [taskId, catId] of Object.entries(prev)) {
        if (catId !== categoryId) next[taskId] = catId;
      }
      return next;
    });
  }

  async function addTask(categoryId: string, e?: React.FormEvent) {
    e?.preventDefault();
    const raw = draftByCategory[categoryId] ?? "";
    const t = raw.trim();
    if (!t) return;

    const tempId = crypto.randomUUID();
    const tempTask: Task = { id: tempId, title: t, done: false, createdAt: new Date().toISOString() };

    setTasks((prev) => [tempTask, ...prev]);
    setDraftByCategory((prev) => ({ ...prev, [categoryId]: "" }));
    setTaskCategory((prev) => ({ ...prev, [tempId]: categoryId }));

    const res = await authedFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: t }),
    });

    if (!res.ok) {
      setTasks((prev) => prev.filter((x) => x.id !== tempId));
      setTaskCategory((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      return;
    }

    const json: { task?: Task } = await res.json().catch(() => ({}));
    const created = json.task;

    if (!created?.id) {
      await load();
      return;
    }

    setTasks((prev) => prev.map((x) => (x.id === tempId ? created : x)));
    if (created.id !== tempId) {
      setTaskCategory((prev) => {
        const next = { ...prev };
        const cat = next[tempId];
        delete next[tempId];
        if (cat) next[created.id] = cat;
        return next;
      });
    }
  }

  async function toggleTask(id: string, currentDone: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !currentDone } : t)));

    const res = await authedFetch("/api/tasks", {
      method: "PATCH",
      body: JSON.stringify({ id, done: !currentDone }),
    });

    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: currentDone } : t)));
    }
  }

  async function removeTask(id: string) {
    const snapshot = tasks;

    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTaskCategory((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const res = await authedFetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) setTasks(snapshot);
  }

  function moveTask(taskId: string, categoryId: string) {
    setTaskCategory((prev) => ({ ...prev, [taskId]: categoryId }));
    setMoveModalTaskId(null);
    setCategoryOpen((prev) => ({ ...prev, [categoryId]: true }));
  }

  const totals = useMemo(() => {
    const out: Record<string, { total: number; open: number }> = {};
    for (const cat of categoriesWithSystem) out[cat.id] = { total: 0, open: 0 };

    for (const t of tasks) {
      const catId = taskCategory[t.id] || "uncategorised";
      (out[catId] ??= { total: 0, open: 0 }).total += 1;
      if (!t.done) (out[catId] ??= { total: 0, open: 0 }).open += 1;
    }

    return out;
  }, [tasks, taskCategory, categoriesWithSystem]);

  return (
    <section className="pb-24">
      <header className="mb-6 flex items-end justify-between px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-white/50">
            {loading ? "Syncing…" : remaining === 1 ? "1 task remaining" : `${remaining} tasks remaining`}
          </p>
        </div>
      </header>

      <motion.div layout className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <Palette className="h-5 w-5 text-white/70" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold">Categories</div>
            <div className="text-sm text-white/50">Create a category, pick a colour and an icon.</div>
          </div>
        </div>

        <form onSubmit={createCategory} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full flex-1 rounded-2xl bg-[#121212] px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none transition focus:ring-white/30"
              placeholder="Category name…"
              autoCapitalize="words"
            />

            <button
              type="submit"
              disabled={!normName(newCatName)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-black transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {COLOUR_PRESETS.map((c) => {
                const active = c === newCatColour;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColour(c)}
                    className={cn(
                      "h-9 w-9 rounded-2xl ring-1 transition active:scale-[0.98]",
                      active ? "ring-white/60" : "ring-white/10 hover:ring-white/25"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Set category colour ${c}`}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {ICON_PRESETS.map((p) => {
                const active = p.key === newCatIcon;
                const Icon = ICONS[p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setNewCatIcon(p.key)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl ring-1 transition active:scale-[0.98]",
                      active ? "bg-white/10 ring-white/40" : "bg-[#121212] ring-white/10 hover:ring-white/25"
                    )}
                    aria-label={`Set icon to ${p.label}`}
                    title={p.label}
                  >
                    <Icon className="h-4 w-4 text-white/80" />
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </motion.div>

      <div className="space-y-4">
        {loading && tasks.length === 0 && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/40" />
          </div>
        )}

        {!loading && tasks.length === 0 && <div className="py-10 text-center text-sm text-white/40">No tasks yet.</div>}

        {categoriesWithSystem.map((cat) => {
          const open = categoryOpen[cat.id] ?? false;
          const counts = totals[cat.id] ?? { total: 0, open: 0 };
          const Icon = ICONS[cat.icon];

          const list = grouped[cat.id] ?? [];
          const hasItems = list.length > 0;

          return (
            <motion.div key={cat.id} layout className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-sm">
              <button
                type="button"
                onClick={() => toggleOpen(cat.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/5"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10"
                  style={{ backgroundColor: `${cat.colour}22`, color: cat.colour }}
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold">{cat.name}</span>
                  <span className="block text-sm text-white/50">
                    {counts.total === 0 ? "No tasks" : counts.open === 0 ? "All done" : counts.open === 1 ? "1 open task" : `${counts.open} open tasks`}
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  {cat.id !== "uncategorised" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(cat.id);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#121212] ring-1 ring-white/10 transition hover:ring-white/25 active:scale-[0.98]"
                      aria-label="Delete category"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4 text-white/70" />
                    </button>
                  )}

                  <span
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#121212] ring-1 ring-white/10 transition",
                      open ? "ring-white/25" : "hover:ring-white/25"
                    )}
                    aria-hidden
                  >
                    <ChevronDown className={cn("h-4 w-4 text-white/70 transition-transform", open ? "rotate-180" : "rotate-0")} />
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key={`${cat.id}-content`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 26 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4">
                      <form onSubmit={(e) => void addTask(cat.id, e)} className="mb-4">
                        <div className="flex items-center overflow-hidden rounded-2xl bg-[#121212] p-1 ring-1 ring-white/10 transition focus-within:ring-white/30">
                          <input
                            value={draftByCategory[cat.id] ?? ""}
                            onChange={(e) => setDraftByCategory((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                            className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder:text-white/40 outline-none"
                            placeholder={cat.id === "uncategorised" ? "Add a task…" : `Add a ${cat.name.toLowerCase()} task…`}
                            autoCapitalize="sentences"
                          />
                          <button
                            type="submit"
                            disabled={!((draftByCategory[cat.id] ?? "").trim())}
                            className="mr-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            aria-label="Add task"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </form>

                      {!hasItems && <div className="py-6 text-center text-sm text-white/40">Nothing here yet.</div>}

                      <ul className="space-y-3">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {list.map((t) => (
                            <TaskItem
                              key={t.id}
                              task={t}
                              onToggle={() => void toggleTask(t.id, t.done)}
                              onRemove={() => void removeTask(t.id)}
                              onOpenMove={() => setMoveModalTaskId(t.id)}
                              highlightColour={cat.id === "uncategorised" ? undefined : cat.colour}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <MoveTaskModal
        open={!!moveModalTaskId}
        taskTitle={moveTaskTarget?.title ?? ""}
        categories={categoriesWithSystem}
        onClose={() => setMoveModalTaskId(null)}
        onMove={(categoryId) => {
          if (!moveModalTaskId) return;
          moveTask(moveModalTaskId, categoryId);
        }}
      />
    </section>
  );
}

function TaskItem({
  task,
  onToggle,
  onRemove,
  onOpenMove,
  highlightColour,
}: {
  task: Task;
  onToggle: () => void;
  onRemove: () => void;
  onOpenMove: () => void;
  highlightColour?: string;
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
          "relative overflow-hidden rounded-2xl border border-white/5 bg-[#121212] shadow-sm",
          task.done ? "opacity-60" : "opacity-100"
        )}
      >
        <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: highlightColour ?? "rgba(255,255,255,0.06)" }} />
        <div className="flex items-center gap-4 p-4 pl-5">
          <button
            onClick={onToggle}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
              task.done ? "border-green-500 bg-green-500 text-black" : "border-white/30 bg-transparent hover:border-white"
            )}
            aria-label={task.done ? "Mark as not done" : "Mark as done"}
          >
            {task.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </button>

          <span className={cn("flex-1 select-none truncate text-base", task.done && "text-white/40 line-through decoration-white/20")}>{task.title}</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMove();
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/25 active:scale-[0.98]"
            aria-label="Move task"
          >
            <MoreHorizontal className="h-4 w-4 text-white/80" />
          </button>
        </div>
      </motion.div>
    </motion.li>
  );
}

function MoveTaskModal({
  open,
  taskTitle,
  categories,
  onClose,
  onMove,
}: {
  open: boolean;
  taskTitle: string;
  categories: Category[];
  onClose: () => void;
  onMove: (categoryId: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="move-task-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white/80">Move task</div>
                <div className="truncate text-base font-semibold">{taskTitle}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/25 active:scale-[0.98]"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto p-2">
              {categories.map((c) => {
                const Icon = ICONS[c.icon];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onMove(c.id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/10 active:scale-[0.99]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl ring-1 ring-white/10" style={{ backgroundColor: `${c.colour}22`, color: c.colour }}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white/90">{c.name}</span>
                      <span className="block text-xs text-white/50">Move here</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
