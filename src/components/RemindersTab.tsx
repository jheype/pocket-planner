"use client";

import { useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";
import EnableNotifications from "@/components/EnableNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Trash2, Clock, Calendar, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type Occurrence = { id: string; scheduledAt: string; status: string };
type Reminder = { id: string; title: string; notes?: string | null; occurrences: Occurrence[] };
type TimeRow = { date: string; time: string };

function toUtcIso(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`);
  return d.toISOString();
}

function fmtLocal(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export default function RemindersTab() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<TimeRow[]>([{ date: "", time: "" }]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    const filled = rows.filter((r) => r.date && r.time);
    return filled.length > 0;
  }, [title, rows]);

  async function load() {
    const res = await authedFetch("/api/reminders");
    const json = await res.json();
    setReminders(json.reminders ?? []);
    setLoading(false);
  }

useEffect(() => {
  const t = setTimeout(() => {
    void load();
  }, 0);

  return () => clearTimeout(t);
}, []);

  function addRow() { setRows((r) => [...r, { date: "", time: "" }]); }
  function updateRow(i: number, patch: Partial<TimeRow>) {
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeRow(i: number) { setRows((r) => r.filter((_, idx) => idx !== i)); }

  async function save() {
    if (!canSave) return;
    const times = rows.filter((r) => r.date && r.time).map((r) => toUtcIso(r.date, r.time));
    const payload = { title: title.trim(), notes: notes.trim() || undefined, times };

    setTitle(""); setNotes(""); setRows([{ date: "", time: "" }]); setIsFormOpen(false);

    const res = await authedFetch("/api/reminders", { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) await load();
  }

  async function removeReminder(id: string) {
    setReminders(prev => prev.filter(r => r.id !== id));
    await authedFetch(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  return (
    <section className="pb-24">
      <div className="mb-6 flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold tracking-tight">Reminders</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFormOpen(!isFormOpen)}
          className={cn("rounded-full p-2 transition-colors", isFormOpen ? "bg-white text-black" : "bg-white/10 text-white")}
        >
          <Plus className={cn("h-6 w-6 transition-transform", isFormOpen ? "rotate-45" : "")} />
        </motion.button>
      </div>

      <div className="mb-6">
        <EnableNotifications />
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/40">Details</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-black/20 px-4 py-3 text-base outline-none ring-1 ring-white/5 focus:ring-white/20"
                placeholder="Ex: Dentist Appointment"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 w-full resize-none rounded-xl bg-black/20 px-4 py-3 text-sm outline-none ring-1 ring-white/5 focus:ring-white/20"
                placeholder="Add notes..."
                rows={2}
              />

              <div className="mt-6 flex items-center justify-between">
                 <label className="text-xs font-semibold uppercase tracking-wider text-white/40">Schedule</label>
                 <button onClick={addRow} className="text-xs text-blue-300 hover:text-blue-200">+ Add time</button>
              </div>
              
              <div className="mt-2 space-y-2">
                {rows.map((r, i) => (
                  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={i} className="flex gap-2">
                    <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 pointer-events-none"/>
                        <input type="date" value={r.date} onChange={(e) => updateRow(i, { date: e.target.value })} 
                            className="w-full rounded-lg bg-black/40 pl-9 pr-2 py-2.5 text-sm text-white/90 outline-none focus:ring-1 focus:ring-white/20 [color-scheme:dark]" />
                    </div>
                    <div className="relative w-28">
                        <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 pointer-events-none"/>
                        <input type="time" value={r.time} onChange={(e) => updateRow(i, { time: e.target.value })} 
                            className="w-full rounded-lg bg-black/40 pl-9 pr-2 py-2.5 text-sm text-white/90 outline-none focus:ring-1 focus:ring-white/20 [color-scheme:dark]" />
                    </div>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(i)} className="flex items-center justify-center rounded-lg bg-white/5 px-3 text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              <button
                onClick={save}
                disabled={!canSave}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition-transform active:scale-95 disabled:bg-white/10 disabled:text-white/40"
              >
                <Save className="h-4 w-4" /> Save Reminder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {reminders.map((r) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={r.id}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#121212] p-4 transition-colors hover:bg-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-blue-400" />
                    <h3 className="truncate font-semibold text-white">{r.title}</h3>
                </div>
                {r.notes && <p className="mt-1 text-sm text-white/60 line-clamp-2">{r.notes}</p>}
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.occurrences.map((o) => (
                    <span key={o.id} className={cn(
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                        o.status === "sent" ? "bg-green-500/10 text-green-400 ring-green-500/20" : "bg-white/5 text-white/70 ring-white/10"
                    )}>
                      {fmtLocal(o.scheduledAt)}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => removeReminder(r.id)}
                className="absolute right-4 top-4 rounded-lg p-2 text-white/20 transition-colors hover:bg-white/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {!loading && reminders.length === 0 && !isFormOpen && (
             <div className="mt-12 flex flex-col items-center justify-center text-center opacity-40">
                <CalendarClock className="mb-3 h-12 w-12" />
                <p className="text-sm">No reminders set.</p>
             </div>
        )}
      </div>
    </section>
  );
}