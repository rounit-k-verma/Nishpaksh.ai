"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AuditResult } from "@/lib/api";
import { AuditSummaryCard } from "@/components/AuditSummaryCard";
import { computeFairnessScore, getBiasRiskLevel, getRecommendedActions, getTopRisks } from "@/lib/auditSummary";

export default function DashboardPage() {
  const [result, setResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("nishpaksh_audit_result");
    if (raw) setResult(JSON.parse(raw));
  }, []);

  if (!result) {
    return (
      <main className="page-wrap">
        <section className="card">No audit results found. Please upload a dataset first.</section>
      </main>
    );
  }

  const selectionData = Object.entries(result.selection_rate_by_gender).map(([group, rate]) => ({
    group,
    rate: Number((rate * 100).toFixed(2))
  }));
  const fairness = computeFairnessScore(result);
  const biasRisk = getBiasRiskLevel(result);
  const topRisks = getTopRisks(result);
  const recommendedActions = getRecommendedActions(result);
  const scoreBadgeClass =
    fairness.score >= 80
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : fairness.score >= 60
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  const riskBadgeClass =
    biasRisk.level === "Low"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : biasRisk.level === "Medium"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  const findings = [
    {
      title: "Disparate Impact",
      value: result.disparate_impact_ratio.toFixed(3),
      detail:
        result.disparate_impact_ratio < 0.8
          ? "Below threshold; indicates adverse impact risk."
          : "Within acceptable range; monitor continuously."
    },
    {
      title: "Gender Selection Gap",
      value: `${(
        (Math.max(...Object.values(result.selection_rate_by_gender)) -
          Math.min(...Object.values(result.selection_rate_by_gender))) *
        100
      ).toFixed(1)}%`,
      detail: "Difference between highest and lowest gender selection rates."
    },
    {
      title: "Model Reliability",
      value: `${(result.model_accuracy * 100).toFixed(1)}%`,
      detail: result.model_accuracy < 0.75 ? "Reliability risk may amplify unfair outcomes." : "Accuracy supports stable decisions."
    }
  ];

  return (
    <main className="page-wrap grid gap-6 md:gap-7">
      <section className="card border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-indigo-50 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Audit Judgment Panel</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Fairness Review Outcome</h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overall Fairness Score</p>
                <div className="mt-1 flex items-center gap-3">
                  <p className="text-4xl font-semibold tracking-tight text-slate-900">{fairness.score}</p>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${scoreBadgeClass}`}>{fairness.level}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bias Risk Level</p>
                <div className="mt-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass}`}>{biasRisk.level}</span>
                </div>
              </div>
            </div>
            <p className="max-w-3xl text-sm text-slate-600">{fairness.explanation} {biasRisk.explanation}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reference</p>
            <p className="mt-1 text-sm text-slate-600">80+ Strong</p>
            <p className="text-sm text-slate-600">60-79 Moderate</p>
            <p className="text-sm text-slate-600">&lt;60 Needs Attention</p>
          </div>
        </div>
      </section>

      <AuditSummaryCard result={result} />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card">
          <p className="text-sm text-slate-500">Model Accuracy</p>
          <p className="mt-2 text-3xl font-semibold">{(result.model_accuracy * 100).toFixed(2)}%</p>
        </article>
        <article className="card">
          <p className="text-sm text-slate-500">Disparate Impact Ratio</p>
          <p className="mt-2 text-3xl font-semibold">{result.disparate_impact_ratio.toFixed(3)}</p>
        </article>
        <article className="card">
          <p className="text-sm text-slate-500">Groups Audited</p>
          <p className="mt-2 text-3xl font-semibold">{selectionData.length}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <article className="card lg:col-span-8">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Gender Selection Disparity</h2>
            <p className="text-sm text-slate-600">
              Positive-outcome rates by gender group. Lower spread indicates fairer outcomes.
            </p>
          </div>
          <div className="h-80 md:h-[22rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectionData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="group" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Selection rate"]}
                  contentStyle={{
                    borderRadius: "12px",
                    borderColor: "#e2e8f0",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.08)"
                  }}
                />
                <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="4 4" />
                <Bar dataKey="rate" radius={[10, 10, 4, 4]}>
                  {selectionData.map((item) => (
                    <Cell key={item.group} fill={item.rate >= 50 ? "#4f46e5" : "#6366f1"} />
                  ))}
                  <LabelList dataKey="rate" position="top" formatter={(value: number) => `${value}%`} fill="#334155" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <section className="grid gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
          {findings.map((finding, idx) => (
            <article key={finding.title} className="card border-slate-200/90 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Finding {idx + 1}</p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{finding.title}</h3>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{finding.value}</p>
              <p className="mt-2 text-sm text-slate-600">{finding.detail}</p>
            </article>
          ))}
        </section>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-900">Top 3 Risk Findings</h2>
        <p className="mt-1 text-sm text-slate-600">Most important fairness and governance concerns from this audit run.</p>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {topRisks.map((risk, idx) => (
            <li key={risk} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-700">Risk {idx + 1}</span>
              {risk}
            </li>
          ))}
        </ul>
      </section>

      <section className="card border-slate-200/90 bg-gradient-to-br from-white to-slate-50">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Recommended Actions</h2>
          <p className="text-sm text-slate-600">Concise implementation plan to reduce bias and improve decision equity.</p>
        </div>
        <ol className="grid gap-3 md:grid-cols-2">
          {recommendedActions.map((action, idx) => (
            <li key={action} className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm transition hover:shadow-md">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-700">Action {idx + 1}</p>
              <p>{action}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
