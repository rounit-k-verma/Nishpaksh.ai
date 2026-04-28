"use client";

import { useEffect, useState } from "react";
import type { AuditResult } from "@/lib/api";
import { AuditSummaryCard } from "@/components/AuditSummaryCard";

export default function RecommendationsPage() {
  const [result, setResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("nishpaksh_audit_result");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  const fallback = [
    "Collect more representative samples across gender categories.",
    "Review proxy features that may indirectly encode sensitive traits.",
    "Track fairness metrics in every model release before deployment."
  ];

  const recommendations = result?.recommendations?.length ? result.recommendations : fallback;

  return (
    <main className="page-wrap space-y-6">
      {result && <AuditSummaryCard result={result} />}
      <section className="card mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">Fairness Recommendations</h1>
        <p className="mt-2 text-sm text-slate-600">
          Action plan generated from fairness diagnostics to improve responsible decision-making.
        </p>
        <ul className="mt-6 space-y-3">
          {recommendations.map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
