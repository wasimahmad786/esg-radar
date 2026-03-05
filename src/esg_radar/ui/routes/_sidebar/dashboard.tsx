import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Suspense, useRef, useState } from "react";
import { z } from "zod";
import {
  useGetFiltersSuspense,
  useGetKpisSuspense,
  useGetEsgTrendsSuspense,
  useGetEsgBySectorSuspense,
  useGetEnvironmentalSuspense,
  useGetFinancialSuspense,
  useGetCompaniesSuspense,
  useGenieAsk,
  type GenieAskResponse,
} from "@/lib/api";
import selector from "@/lib/selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Leaf, Users, Building2, BarChart2, Send, ChevronDown, ChevronUp, Bot, Loader2 } from "lucide-react";

// ── Route + search params ──────────────────────────────────────────────────────

const searchSchema = z.object({
  sector: z.string().optional(),
  company_id: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
});

type DashboardSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_sidebar/dashboard")({
  validateSearch: searchSchema,
  component: Dashboard,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(1);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="w-full rounded-md" style={{ height }} />
      </CardContent>
    </Card>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBarContent({ search }: { search: DashboardSearch }) {
  const navigate = useNavigate({ from: "/dashboard" });
  const { data: filters } = useGetFiltersSuspense(selector());

  const setParam = (key: keyof DashboardSearch, value: string) => {
    const resolved = value === "__all__" ? undefined : value;
    navigate({
      search: (prev) => ({
        ...prev,
        [key]:
          resolved === undefined
            ? undefined
            : key === "year" || key === "company_id"
            ? Number(resolved)
            : resolved,
      }),
    });
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Sector</label>
        <Select value={search.sector ?? "__all__"} onValueChange={(v) => setParam("sector", v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Sectors</SelectItem>
            {filters.sectors.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Company</label>
        <Select
          value={search.company_id?.toString() ?? "__all__"}
          onValueChange={(v) => setParam("company_id", v)}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="__all__">All Companies</SelectItem>
            {Object.entries(
              filters.companies.reduce<Record<string, typeof filters.companies>>((acc, c) => {
                (acc[c.industry] ??= []).push(c);
                return acc;
              }, {})
            ).map(([industry, companies]) => (
              <SelectGroup key={industry}>
                <SelectLabel className="text-xs font-semibold text-muted-foreground">
                  {industry}
                </SelectLabel>
                {companies.map((c) => (
                  <SelectItem key={c.company_id} value={String(c.company_id)}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Year</label>
        <Select value={search.year?.toString() ?? "__all__"} onValueChange={(v) => setParam("year", v)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Years</SelectItem>
            {filters.years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function FilterBar({ search }: { search: DashboardSearch }) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-32" />
        </div>
      }
    >
      <FilterBarContent search={search} />
    </Suspense>
  );
}

// ── KPI Cards ─────────────────────────────────────────────────────────────────

function KpiCardsContent({ search }: { search: DashboardSearch }) {
  const { data: kpis } = useGetKpisSuspense({
    ...selector(),
    params: {
      sector: search.sector,
      company_id: search.company_id,
      year: search.year,
    },
  });

  const cards = [
    {
      label: "Total ESG Score",
      value: kpis.esg_overall,
      icon: <BarChart2 className="h-5 w-5 text-muted-foreground" />,
      color: "text-foreground",
    },
    {
      label: "Environmental",
      value: kpis.esg_environmental,
      icon: <Leaf className="h-5 w-5 text-green-500" />,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Social",
      value: kpis.esg_social,
      icon: <Users className="h-5 w-5 text-blue-500" />,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Governance",
      value: kpis.esg_governance,
      icon: <Building2 className="h-5 w-5 text-purple-500" />,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${card.color}`}>
              {card.value.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">out of 100</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function KpiCards({ search }: { search: DashboardSearch }) {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
      <KpiCardsContent search={search} />
    </Suspense>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function EsgTrendsChart({ search }: { search: DashboardSearch }) {
  const { data: trends } = useGetEsgTrendsSuspense({
    ...selector(),
    params: { sector: search.sector, company_id: search.company_id },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ESG Score Trends (2015–2025)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="year" className="text-xs" />
            <YAxis domain={[0, 100]} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="esg_overall" name="Overall" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="esg_environmental" name="Environmental" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="esg_social" name="Social" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="esg_governance" name="Governance" stroke="#a855f7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function EsgBySectorChart({ search }: { search: DashboardSearch }) {
  const { data: sectorData } = useGetEsgBySectorSuspense({
    ...selector(),
    params: { year: search.year },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ESG Scores by Sector</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(280, sectorData.length * 28)}>
          <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" domain={[0, 100]} className="text-xs" />
            <YAxis type="category" dataKey="sector" className="text-xs" width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="esg_environmental" name="Environmental" fill="#22c55e" />
            <Bar dataKey="esg_social" name="Social" fill="#3b82f6" />
            <Bar dataKey="esg_governance" name="Governance" fill="#a855f7" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Environmental Tab ─────────────────────────────────────────────────────────

function EnvironmentalCharts({ search }: { search: DashboardSearch }) {
  const { data: envData } = useGetEnvironmentalSuspense({
    ...selector(),
    params: { sector: search.sector, company_id: search.company_id },
  });

  const charts = [
    { key: "carbon_emissions" as const, label: "Carbon Emissions (tons CO₂)", color: "#ef4444" },
    { key: "water_usage" as const, label: "Water Usage (m³)", color: "#06b6d4" },
    { key: "energy_consumption" as const, label: "Energy Consumption (MWh)", color: "#f59e0b" },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {charts.map(({ key, label, color }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={envData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={formatCompact} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(v: unknown) => [formatNumber(Number(v)), label]}
                />
                <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Financial Tab ─────────────────────────────────────────────────────────────

function FinancialCharts({ search }: { search: DashboardSearch }) {
  const { data: finData } = useGetFinancialSuspense({
    ...selector(),
    params: { sector: search.sector, company_id: search.company_id },
  });

  const charts = [
    { key: "revenue" as const, label: "Revenue (M USD)", color: "#6366f1" },
    { key: "market_cap" as const, label: "Market Cap (M USD)", color: "#ec4899" },
    { key: "profit_margin" as const, label: "Profit Margin (%)", color: "#14b8a6" },
    { key: "growth_rate" as const, label: "Growth Rate (%)", color: "#f97316" },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {charts.map(({ key, label, color }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-sm">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={finData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={formatCompact} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(v: unknown) => [formatNumber(Number(v)), label]}
                />
                <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Comparison Tab ────────────────────────────────────────────────────────────

function CompanyTable({ search }: { search: DashboardSearch }) {
  const { data: companies } = useGetCompaniesSuspense({
    ...selector(),
    params: { sector: search.sector, year: search.year },
  });

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company ESG Comparison ({companies.length} companies)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card z-10">Company</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Industry</TableHead>
                <TableHead className="sticky top-0 bg-card z-10">Region</TableHead>
                <TableHead className="sticky top-0 bg-card z-10 text-center">Year</TableHead>
                <TableHead className="sticky top-0 bg-card z-10 text-right">Overall</TableHead>
                <TableHead className="sticky top-0 bg-card z-10 text-right">Env</TableHead>
                <TableHead className="sticky top-0 bg-card z-10 text-right">Social</TableHead>
                <TableHead className="sticky top-0 bg-card z-10 text-right">Gov</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No companies found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={`${company.company_id}-${company.year}`}>
                    <TableCell className="font-medium">{company.company_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{company.industry}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{company.region}</TableCell>
                    <TableCell className="text-center">{company.year}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={getScoreColor(company.esg_overall)}>
                        {company.esg_overall.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{company.esg_environmental.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-sm">{company.esg_social.toFixed(1)}</TableCell>
                    <TableCell className="text-right text-sm">{company.esg_governance.toFixed(1)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Ask AI (Genie) Tab ────────────────────────────────────────────────────────

const SAMPLE_QUESTIONS = [
  "Which companies have the highest ESG score in 2025?",
  "What is the average ESG score by industry sector?",
  "Show me carbon emissions trend from 2015 to 2025",
  "Which sector has the best governance scores?",
  "Compare ESG scores between Technology and Energy sectors",
  "Top 10 companies by market cap in the Finance sector",
  "Which companies improved their ESG score the most over 10 years?",
  "What is the relationship between revenue and ESG score?",
];

type ChatMessage = {
  role: "user" | "assistant";
  question: string;
  response?: GenieAskResponse;
};

function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {open ? "Hide SQL" : "Show SQL"}
      </button>
      {open && (
        <pre className="mt-2 p-3 rounded-md bg-muted text-xs overflow-x-auto font-mono text-foreground">
          {sql}
        </pre>
      )}
    </div>
  );
}

function ResultTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  if (!columns.length || !rows.length) return null;
  return (
    <div className="mt-3 overflow-auto max-h-64 rounded-md border text-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="whitespace-nowrap text-xs">{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j} className="text-xs whitespace-nowrap">
                  {cell === null || cell === undefined ? "—" : String(cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AskAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const mutation = useGenieAsk();

  const send = async (question: string) => {
    if (!question.trim() || mutation.isPending) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", question };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const result = await mutation.mutateAsync({ question, conversation_id: conversationId });

    if (result.data.conversation_id) {
      setConversationId(result.data.conversation_id);
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", question, response: result.data },
    ]);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const reset = () => {
    setMessages([]);
    setConversationId(undefined);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">Ask questions about the ESG data in plain English.</p>
            <p className="text-xs text-muted-foreground">Powered by Databricks Genie · Corporate ESG Metrics space</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground underline">
            New conversation
          </button>
        )}
      </div>

      {/* Sample questions */}
      {messages.length === 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={mutation.isPending}
                className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors text-muted-foreground disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 text-sm">
                    {msg.question}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.response?.error ? (
                      <p className="text-sm text-destructive">{msg.response.error}</p>
                    ) : (
                      <>
                        {msg.response?.text && (
                          <p className="text-sm leading-relaxed">{msg.response.text}</p>
                        )}
                        {msg.response?.sql && <SqlBlock sql={msg.response.sql} />}
                        {msg.response?.columns && msg.response?.rows && (
                          <ResultTable
                            columns={msg.response.columns}
                            rows={msg.response.rows as unknown[][]}
                          />
                        )}
                        {msg.response?.row_count != null && msg.response.row_count > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {msg.response.row_count} row{msg.response.row_count !== 1 ? "s" : ""}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Loader2 size={14} className="text-primary animate-spin" />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>Genie is thinking</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Ask anything about the ESG data..."
          disabled={mutation.isPending}
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || mutation.isPending}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
        >
          {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Ask
        </button>
      </div>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

function Dashboard() {
  const search = useSearch({ from: "/_sidebar/dashboard" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ESG Performance Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor environmental, social, and governance metrics across 1,000+ companies (2015–2025)
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar search={search} />

      {/* KPI Cards */}
      <KpiCards search={search} />

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-5 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="ask-ai" className="flex items-center gap-1">
            <Bot size={13} />Ask AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Suspense fallback={<ChartSkeleton />}>
            <EsgTrendsChart search={search} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton height={400} />}>
            <EsgBySectorChart search={search} />
          </Suspense>
        </TabsContent>

        <TabsContent value="environmental" className="mt-4">
          <Suspense
            fallback={
              <div className="grid gap-4 xl:grid-cols-3">
                {[...Array(3)].map((_, i) => <ChartSkeleton key={i} height={220} />)}
              </div>
            }
          >
            <EnvironmentalCharts search={search} />
          </Suspense>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <Suspense
            fallback={
              <div className="grid gap-4 lg:grid-cols-2">
                {[...Array(4)].map((_, i) => <ChartSkeleton key={i} height={220} />)}
              </div>
            }
          >
            <FinancialCharts search={search} />
          </Suspense>
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <Suspense fallback={<ChartSkeleton height={500} />}>
            <CompanyTable search={search} />
          </Suspense>
        </TabsContent>

        <TabsContent value="ask-ai" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <AskAI />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
