"use client";

import { useEffect, useState } from "react";
import type { AuditResult } from "@/lib/api";
import { AuditSummaryCard } from "@/components/AuditSummaryCard";

export default function ReportPage() {
  const [result, setResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("nishpaksh_audit_result");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  if (!result) {
    return (
      <main className="page-wrap">
        <section className="card">No report data available. Run an audit first.</section>
      </main>
    );
  }

  return (
    <main className="page-wrap space-y-6">
      <AuditSummaryCard result={result} />
      <section className="card">
        <h1 className="text-2xl font-semibold">Bias Detection Report</h1>
        <p className="mt-2 text-sm text-slate-600">
          Disparate impact below 0.80 may indicate adverse impact for one group.
        </p>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Confusion Matrix by Group</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(result.confusion_matrix_by_group).map(([group, matrix]) => (
            <article key={group} className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-medium text-slate-800">{group}</h3>
              <p className="mt-2 text-sm text-slate-600">TP: {matrix.tp}</p>
              <p className="text-sm text-slate-600">FP: {matrix.fp}</p>
              <p className="text-sm text-slate-600">TN: {matrix.tn}</p>
              <p className="text-sm text-slate-600">FN: {matrix.fn}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">Top Feature Importance</h2>
        <ul className="space-y-2 text-sm">
          {result.feature_importance.slice(0, 10).map((feature) => (
            <li key={feature.feature} className="flex justify-between rounded-lg bg-slate-100 px-3 py-2">
              <span>{feature.feature}</span>
              <span className="font-medium">{feature.importance.toFixed(4)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
