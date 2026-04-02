"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { authedFetch } from "@/lib/authedFetch";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  X,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type IconKey =
  | "briefcase" | "home" | "dumbbell" | "calendar" | "shopping"
  | "heart" | "plane" | "code" | "palette" | "wrench"
  | "target" | "ideas" | "people" | "sparkles" | "wallet";

type FinanceCategory = {
  id: string;
  name: string;
  colour: string;
  icon: IconKey;
  createdAt: string;
};

type FinanceTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: string | null;
  date: string;
  createdAt: string;
  category: FinanceCategory | null;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

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
  wallet: (p) => <Wallet className={p.className} />,
};

const ICON_PRESETS: Array<{ key: IconKey; label: string }> = [
  { key: "shopping", label: "Compras" },
  { key: "home", label: "Casa" },
  { key: "heart", label: "Saúde" },
  { key: "briefcase", label: "Trabalho" },
  { key: "dumbbell", label: "Treino" },
  { key: "plane", label: "Viagem" },
  { key: "people", label: "Pessoas" },
  { key: "wallet", label: "Finanças" },
  { key: "code", label: "Tech" },
  { key: "palette", label: "Lazer" },
  { key: "sparkles", label: "Pessoal" },
  { key: "target", label: "Metas" },
  { key: "ideas", label: "Ideias" },
  { key: "wrench", label: "Serviços" },
];

const COLOUR_PRESETS = [
  "#60a5fa", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#fb7185", "#22d3ee", "#f97316", "#e5e7eb",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function addMonths(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y!, m! - 1, 1);
  d.setMonth(d.getMonth() + delta);
  return getMonthKey(d);
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

type SubTab = "transactions" | "summary" | "categories";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinanceTab() {
  const [subTab, setSubTab] = useState<SubTab>("transactions");
  const [month, setMonth] = useState(() => getMonthKey(new Date()));

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const loading = loadedMonth !== month;

  // Add transaction form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formSaving, setFormSaving] = useState(false);

  // Add category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatColour, setNewCatColour] = useState(COLOUR_PRESETS[0]!);
  const [newCatIcon, setNewCatIcon] = useState<IconKey>("shopping");
  const [catSaving, setCatSaving] = useState(false);

  async function loadCategories() {
    const res = await authedFetch("/api/finance/categories");
    if (!res.ok) return;
    const json: { categories?: FinanceCategory[] } = await res.json();
    setCategories(json.categories ?? []);
  }

  async function loadTransactions() {
    const res = await authedFetch(`/api/finance/transactions?month=${month}`);
    if (!res.ok) return;
    const json: { transactions?: FinanceTransaction[] } = await res.json();
    setTransactions(json.transactions ?? []);
    setLoadedMonth(month);
  }

  useEffect(() => {
    let cancelled = false;
    authedFetch("/api/finance/categories")
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const json: { categories?: FinanceCategory[] } = await res.json();
        setCategories(json.categories ?? []);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    authedFetch(`/api/finance/transactions?month=${month}`)
      .then(async (res) => {
        if (cancelled || !res.ok) return;
        const json: { transactions?: FinanceTransaction[] } = await res.json();
        setTransactions(json.transactions ?? []);
        setLoadedMonth(month);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [month]);

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // Spend by category for summary
  const spendByCategory = useMemo(() => {
    const map: Record<string, { category: FinanceCategory | null; total: number }> = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const key = t.categoryId ?? "__none__";
      if (!map[key]) map[key] = { category: t.category, total: 0 };
      map[key]!.total += t.amount;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const maxSpend = useMemo(() => Math.max(...spendByCategory.map(s => s.total), 1), [spendByCategory]);

  async function addTransaction(e?: React.FormEvent) {
    e?.preventDefault();
    const amount = parseFloat(formAmount.replace(",", "."));
    if (!formDescription.trim() || isNaN(amount) || amount <= 0) return;
    setFormSaving(true);

    const res = await authedFetch("/api/finance/transactions", {
      method: "POST",
      body: JSON.stringify({
        type: formType,
        amount,
        description: formDescription.trim(),
        categoryId: formCategory || null,
        date: new Date(formDate + "T12:00:00").toISOString(),
      }),
    });

    if (res.ok) {
      setFormAmount("");
      setFormDescription("");
      setFormCategory("");
      setFormDate(new Date().toISOString().slice(0, 10));
      setShowAddForm(false);
      await loadTransactions();
    }
    setFormSaving(false);
  }

  async function deleteTransaction(id: string) {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await authedFetch(`/api/finance/transactions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async function addCategory(e?: React.FormEvent) {
    e?.preventDefault();
    const name = newCatName.trim().slice(0, 40);
    if (!name) return;
    setCatSaving(true);
    const res = await authedFetch("/api/finance/categories", {
      method: "POST",
      body: JSON.stringify({ name, colour: newCatColour, icon: newCatIcon }),
    });
    if (res.ok) {
      setNewCatName("");
      await loadCategories();
    }
    setCatSaving(false);
  }

  async function deleteCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id));
    await authedFetch(`/api/finance/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  return (
    <section className="pb-24">
      {/* Header */}
      <header className="mb-6 px-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Finanças</h2>
            <p className="text-sm text-white/50">{getMonthLabel(month)}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black transition active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" /> Registrar
          </button>
        </div>

        {/* Month navigator */}
        <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <button
            type="button"
            onClick={() => setMonth(m => addMonths(m, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-[0.97]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold capitalize">{getMonthLabel(month)}</span>
          <button
            type="button"
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 active:scale-[0.97]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Totals */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs text-white/50">Entradas</p>
            <p className="mt-1 text-sm font-bold text-emerald-400">{formatCurrency(totals.income)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs text-white/50">Saídas</p>
            <p className="mt-1 text-sm font-bold text-red-400">{formatCurrency(totals.expense)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs text-white/50">Saldo</p>
            <p className={cn("mt-1 text-sm font-bold", totals.balance >= 0 ? "text-white" : "text-red-400")}>
              {formatCurrency(totals.balance)}
            </p>
          </div>
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="mb-5 grid grid-cols-3 rounded-2xl bg-white/5 p-1">
        {(["transactions", "summary", "categories"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "relative py-2.5 text-xs font-medium transition-colors duration-200 rounded-xl",
              subTab === t ? "bg-white text-black shadow-sm" : "text-white/60 hover:text-white"
            )}
          >
            {t === "transactions" ? "Lançamentos" : t === "summary" ? "Resumo" : "Categorias"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {subTab === "transactions" && (
            <TransactionsView
              transactions={transactions}
              loading={loading}
              onDelete={deleteTransaction}
            />
          )}
          {subTab === "summary" && (
            <SummaryView
              spendByCategory={spendByCategory}
              maxSpend={maxSpend}
              totals={totals}
              transactions={transactions}
            />
          )}
          {subTab === "categories" && (
            <CategoriesView
              categories={categories}
              newCatName={newCatName}
              newCatColour={newCatColour}
              newCatIcon={newCatIcon}
              saving={catSaving}
              onNameChange={setNewCatName}
              onColourChange={setNewCatColour}
              onIconChange={setNewCatIcon}
              onAdd={addCategory}
              onDelete={deleteCategory}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={showAddForm}
        categories={categories}
        type={formType}
        amount={formAmount}
        description={formDescription}
        categoryId={formCategory}
        date={formDate}
        saving={formSaving}
        onTypeChange={setFormType}
        onAmountChange={setFormAmount}
        onDescriptionChange={setFormDescription}
        onCategoryChange={setFormCategory}
        onDateChange={setFormDate}
        onClose={() => setShowAddForm(false)}
        onSubmit={addTransaction}
      />
    </section>
  );
}

// ─── Transactions View ────────────────────────────────────────────────────────

function TransactionsView({
  transactions,
  loading,
  onDelete,
}: {
  transactions: FinanceTransaction[];
  loading: boolean;
  onDelete: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-white/40">
        Nenhum lançamento neste mês.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {transactions.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
          >
            {/* Type icon */}
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                t.type === "income"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              )}
            >
              {t.type === "income"
                ? <ArrowDownLeft className="h-5 w-5" />
                : <ArrowUpRight className="h-5 w-5" />}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {t.category && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${t.category.colour}22`,
                      color: t.category.colour,
                    }}
                  >
                    {t.category.name}
                  </span>
                )}
                <span className="text-xs text-white/40">
                  {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-bold",
                  t.type === "income" ? "text-emerald-400" : "text-red-400"
                )}
              >
                {t.type === "income" ? "+" : "-"}
                {formatCurrency(t.amount)}
              </span>
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/40 transition hover:bg-red-500/20 hover:text-red-400 active:scale-[0.97]"
                aria-label="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Summary View ─────────────────────────────────────────────────────────────

function SummaryView({
  spendByCategory,
  maxSpend,
  totals,
  transactions,
}: {
  spendByCategory: Array<{ category: FinanceCategory | null; total: number }>;
  maxSpend: number;
  totals: { income: number; expense: number; balance: number };
  transactions: FinanceTransaction[];
}) {
  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-white/40">
        Nenhum dado para exibir neste mês.
      </div>
    );
  }

  // Top income sources
  const incomeEntries = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => {
      acc[t.description] = (acc[t.description] ?? 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topIncomes = Object.entries(incomeEntries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Expense breakdown */}
      {spendByCategory.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
              <TrendingDown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold">Gastos por categoria</p>
              <p className="text-sm text-white/50">Total: {formatCurrency(totals.expense)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {spendByCategory.map((s, i) => {
              const colour = s.category?.colour ?? "#9ca3af";
              const pct = Math.round((s.total / maxSpend) * 100);
              return (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {s.category ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${colour}22`, color: colour }}
                        >
                          {s.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">Sem categoria</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-red-400">
                      {formatCurrency(s.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: colour }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-white/30">
                    {Math.round((s.total / totals.expense) * 100)}% dos gastos
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top incomes */}
      {topIncomes.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold">Principais entradas</p>
              <p className="text-sm text-white/50">Total: {formatCurrency(totals.income)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {topIncomes.map(([desc, amount]) => (
              <div key={desc} className="flex items-center justify-between">
                <span className="truncate text-sm text-white/80">{desc}</span>
                <span className="ml-4 shrink-0 text-sm font-semibold text-emerald-400">
                  +{formatCurrency(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balance summary */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <BarChart3 className="h-5 w-5 text-white/70" />
          </span>
          <p className="text-base font-semibold">Balanço do mês</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Total de entradas</span>
            <span className="font-semibold text-emerald-400">{formatCurrency(totals.income)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Total de saídas</span>
            <span className="font-semibold text-red-400">{formatCurrency(totals.expense)}</span>
          </div>
          <div className="my-2 border-t border-white/10" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Saldo líquido</span>
            <span className={cn("font-bold", totals.balance >= 0 ? "text-white" : "text-red-400")}>
              {formatCurrency(totals.balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Categories View ──────────────────────────────────────────────────────────

function CategoriesView({
  categories,
  newCatName,
  newCatColour,
  newCatIcon,
  saving,
  onNameChange,
  onColourChange,
  onIconChange,
  onAdd,
  onDelete,
}: {
  categories: FinanceCategory[];
  newCatName: string;
  newCatColour: string;
  newCatIcon: IconKey;
  saving: boolean;
  onNameChange: (v: string) => void;
  onColourChange: (v: string) => void;
  onIconChange: (v: IconKey) => void;
  onAdd: (e?: React.FormEvent) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Create category */}
      <motion.div layout className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
            <Palette className="h-5 w-5 text-white/70" />
          </div>
          <div>
            <p className="text-base font-semibold">Nova categoria</p>
            <p className="text-sm text-white/50">Organize seus gastos por tipo.</p>
          </div>
        </div>

        <form onSubmit={onAdd} className="space-y-3">
          <div className="flex gap-2">
            <input
              value={newCatName}
              onChange={(e) => onNameChange(e.target.value)}
              className="flex-1 rounded-2xl bg-[#121212] px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none transition focus:ring-white/30"
              placeholder="Nome da categoria…"
              autoCapitalize="words"
            />
            <button
              type="submit"
              disabled={!newCatName.trim() || saving}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-black transition active:scale-[0.97] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar
            </button>
          </div>

          {/* Colours */}
          <div className="flex flex-wrap gap-2">
            {COLOUR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColourChange(c)}
                className={cn(
                  "h-9 w-9 rounded-2xl ring-1 transition active:scale-[0.97]",
                  c === newCatColour ? "ring-white/60" : "ring-white/10 hover:ring-white/25"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Icons */}
          <div className="grid grid-cols-7 gap-2">
            {ICON_PRESETS.map((p) => {
              const Icon = ICONS[p.key];
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onIconChange(p.key)}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl ring-1 transition active:scale-[0.97]",
                    p.key === newCatIcon ? "bg-white/10 ring-white/40" : "bg-[#121212] ring-white/10 hover:ring-white/25"
                  )}
                  title={p.label}
                >
                  <Icon className="h-4 w-4 text-white/80" />
                </button>
              );
            })}
          </div>
        </form>
      </motion.div>

      {/* Category list */}
      {categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/40">Nenhuma categoria criada ainda.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon as IconKey] ?? ICONS.shopping;
            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/10"
                  style={{ backgroundColor: `${cat.colour}22`, color: cat.colour }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-semibold">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => onDelete(cat.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/40 transition hover:bg-red-500/20 hover:text-red-400 active:scale-[0.97]"
                  aria-label="Excluir categoria"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Add Transaction Modal ────────────────────────────────────────────────────

function AddTransactionModal({
  open,
  categories,
  type,
  amount,
  description,
  categoryId,
  date,
  saving,
  onTypeChange,
  onAmountChange,
  onDescriptionChange,
  onCategoryChange,
  onDateChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  categories: FinanceCategory[];
  type: "income" | "expense";
  amount: string;
  description: string;
  categoryId: string;
  date: string;
  saving: boolean;
  onTypeChange: (v: "income" | "expense") => void;
  onAmountChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onClose: () => void;
  onSubmit: (e?: React.FormEvent) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="add-transaction-modal"
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
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <p className="text-base font-semibold">Novo lançamento</p>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-[0.97]"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4 p-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 rounded-2xl bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => onTypeChange("expense")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
                    type === "expense" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"
                  )}
                >
                  <ArrowUpRight className="h-4 w-4" /> Saída
                </button>
                <button
                  type="button"
                  onClick={() => onTypeChange("income")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition",
                    type === "income" ? "bg-emerald-500 text-white" : "text-white/50 hover:text-white"
                  )}
                >
                  <ArrowDownLeft className="h-4 w-4" /> Entrada
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="w-full rounded-2xl bg-[#121212] px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none transition focus:ring-white/30"
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="w-full rounded-2xl bg-[#121212] px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none transition focus:ring-white/30"
                  placeholder="Ex: Supermercado, Salário…"
                  autoCapitalize="sentences"
                  required
                />
              </div>

              {/* Category (only for expenses) */}
              {type === "expense" && categories.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/50 uppercase tracking-wide">
                    Categoria (opcional)
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="w-full rounded-2xl bg-[#121212] px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none transition focus:ring-white/30"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full rounded-2xl bg-[#121212] px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none transition focus:ring-white/30"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !amount || !description.trim()}
                className={cn(
                  "w-full rounded-2xl py-3.5 text-sm font-bold transition active:scale-[0.97] disabled:opacity-50",
                  type === "expense" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                )}
              >
                {saving
                  ? <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  : type === "expense" ? "Registrar saída" : "Registrar entrada"
                }
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
