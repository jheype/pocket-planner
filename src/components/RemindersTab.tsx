"use client";

import { useEffect, useMemo, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";
import EnableNotifications from "@/components/EnableNotifications";

type Occurrence = {
  id: string;
  scheduledAt: string;
  status: string;
};

type Reminder = {
  id: string;
  title: string;
  notes?: string | null;
  occurrences: Occurrence[];
};

type TimeRow = { date: string; time: string };

function toUtcIso(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`);
  return d.toISOString();
}

function fmtLocal(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function RemindersTab() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<TimeRow[]>([{ date: "", time: "" }]);
  const [loading, setLoading] = useState(true);

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    const filled = rows.filter((r) => r.date && r.time);
    return filled.length > 0;
  }, [title, rows]);

  async function load() {
    setLoading(true);
    const res = await authedFetch("/api/reminders");
    const json = await res.json();
    setReminders(json.reminders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
        await load();
    })();
    }, []);

  function addRow() {
    setRows((r) => [...r, { date: "", time: "" }]);
  }

  function updateRow(i: number, patch: Partial<TimeRow>) {
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!canSave) return;

    const times = rows
      .filter((r) => r.date && r.time)
      .map((r) => toUtcIso(r.date, r.time));

    const payload = {
      title: title.trim(),
      notes: notes.trim() ? notes.trim() : undefined,
      times,
    };

    setTitle("");
    setNotes("");
    setRows([{ date: "", time: "" }]);

    const res = await authedFetch("/api/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) await load();
  }

  async function removeReminder(id: string) {
    const res = await authedFetch(`/api/reminders?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) await load();
  }

  return (
    <section>
      <h2 className="text-base font-semibold">Reminders</h2>
      <p className="mt-1 text-xs opacity-80">
        Schedule one reminder with multiple times.
      </p>

      <div className="mt-4">
        <EnableNotifications />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <label className="text-xs opacity-80">New reminder</label>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          placeholder="e.g. Call the dentist"
          autoCapitalize="sentences"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
          placeholder="Notes (optional)"
          rows={3}
        />

        <div className="mt-3 text-xs font-medium">Scheduled times</div>
        <div className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="date"
                value={r.date}
                onChange={(e) => updateRow(i, { date: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
              <input
                type="time"
                value={r.time}
                onChange={(e) => updateRow(i, { time: e.target.value })}
                className="w-[150px] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
              />
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={addRow}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
          >
            Add another time
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            className={[
              "w-full rounded-lg px-3 py-2 text-sm",
              canSave ? "bg-white/15" : "bg-white/5 opacity-60",
            ].join(" ")}
          >
            Save reminder
          </button>
        </div>

        <p className="mt-2 text-xs opacity-70">
          Times are saved in UTC, based on your device&apos;s local time.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {!loading && reminders.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm opacity-80">
            No reminders scheduled.
          </div>
        )}

        {reminders.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.title}</div>
                {r.notes ? (
                  <div className="mt-1 text-xs opacity-80">{r.notes}</div>
                ) : null}
              </div>
              <button
                onClick={() => removeReminder(r.id)}
                className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs"
              >
                Delete
              </button>
            </div>

            <div className="mt-3 space-y-1">
              {r.occurrences.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-xs">
                  <span className="opacity-80">{fmtLocal(o.scheduledAt)}</span>
                  <span className="rounded-md bg-white/10 px-2 py-1 opacity-80">
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
