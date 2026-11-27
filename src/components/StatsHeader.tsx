import { useMemo } from "react";
import type { Application } from "../types";
import { isGhostingRisk } from "../utils/pipelineUtils";

interface StatsHeaderProps {
  applications: Application[];
}

export function StatsHeader({ applications }: StatsHeaderProps) {
  const stats = useMemo(() => {
    const total = applications.length;
    const activeInPipeline = applications.filter(
      (a) => a.status !== "REJECTED" && a.status !== "GHOSTED"
    ).length;

    const respondedCount = applications.filter((a) =>
      ["SCREENING", "INTERVIEW", "OFFER", "REJECTED"].includes(a.status)
    ).length;
    const responseRate =
      total > 0 ? Math.round((respondedCount / total) * 100) : 0;

    const interviewedCount = applications.filter((a) =>
      ["INTERVIEW", "OFFER"].includes(a.status)
    ).length;
    const interviewRate =
      total > 0 ? Math.round((interviewedCount / total) * 100) : 0;

    const ghostingCount = applications.filter((a) => isGhostingRisk(a)).length;
    const offerCount = applications.filter((a) => a.status === "OFFER").length;

    return {
      total,
      activeInPipeline,
      respondedCount,
      responseRate,
      interviewedCount,
      interviewRate,
      ghostingCount,
      offerCount,
    };
  }, [applications]);

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Total Lamaran
        </p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">
          {stats.total}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {stats.activeInPipeline} aktif di pipeline
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Response Rate
        </p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">
          {stats.responseRate}%
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {stats.respondedCount} dari {stats.total} diproses
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Interview Rate
        </p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">
          {stats.interviewRate}%
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {stats.interviewedCount} masuk wawancara
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Rawan Ghosting
        </p>
        <p className="text-2xl font-extrabold text-rose-600 mt-1">
          {stats.ghostingCount}
        </p>
        <p className="text-xs text-slate-500 mt-1">&gt;14 hari tanpa kabar</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Offer Diterima
        </p>
        <p className="text-2xl font-extrabold text-emerald-600 mt-1">
          {stats.offerCount}
        </p>
        <p className="text-xs text-slate-500 mt-1">Siap dibandingkan</p>
      </div>
    </section>
  );
}