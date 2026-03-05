import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/apx/navbar";
import { BarChart2, Leaf } from "lucide-react";
import esgHero from "/esg-hero.jpg";

export const Route = createFileRoute("/")({
  component: () => <Index />,
});

function Index() {
  return (
    <div className="relative h-screen w-screen overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Hero image — full width, fixed height */}
        <div className="relative w-full h-56 md:h-72 overflow-hidden">
          <img
            src={esgHero}
            alt="ESG Performance"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay so text below blends in */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-background" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center space-y-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-widest">
            <Leaf size={14} className="text-green-500" />
            Environmental · Social · Governance
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-2xl">
            ESG Performance Dashboard
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-xl">
            Explore ESG scores, financial metrics, and sustainability data across
            1,000+ companies from 2015 to 2025 — powered by Databricks.
          </p>

          <Button size="lg" asChild>
            <Link to="/dashboard" className="flex items-center gap-2">
              <BarChart2 size={18} />
              Open Dashboard
            </Link>
          </Button>

          {/* Stats row */}
          <div className="flex gap-8 pt-4 text-center">
            {[
              { value: "1,000+", label: "Companies" },
              { value: "11 yrs", label: "2015 – 2025" },
              { value: "9", label: "Sectors" },
              { value: "13", label: "Metrics" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* APX badge */}
      <a
        href="https://github.com/databricks-solutions/apx"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 group"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent transition-colors">
          <img
            src="https://raw.githubusercontent.com/databricks-solutions/apx/refs/heads/main/assets/logo.svg"
            className="h-6 w-6"
            alt="apx logo"
          />
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">Built with</span>
            <span className="text-xs font-semibold">apx</span>
          </div>
        </div>
      </a>
    </div>
  );
}
