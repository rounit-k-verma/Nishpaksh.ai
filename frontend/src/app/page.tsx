import Link from "next/link";

const features = [
  "Bias detection in hiring, scholarship, and loan datasets",
  "Selection rate, disparate impact, and group confusion matrices",
  "Explainable feature importance and decision recommendations"
];

export default function LandingPage() {
  return (
    <main className="page-wrap space-y-10">
      <section className="card bg-gradient-to-br from-white to-indigo-50">
        <p className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
          Responsible AI Platform
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Nishpaksh AI</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Audit ML-driven decisions for fairness, reveal hidden bias by gender, and test safer alternatives
          before deploying models in the real world.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/upload" className="rounded-xl bg-brand-500 px-5 py-3 font-medium text-white">
            Start Audit
          </Link>
          <Link href="/dashboard" className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700">
            View Dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((item) => (
          <article key={item} className="card">
            <h3 className="font-semibold text-slate-900">Enterprise-grade fairness checks</h3>
            <p className="mt-2 text-sm text-slate-600">{item}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
