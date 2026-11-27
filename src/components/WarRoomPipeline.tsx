import { useState, useMemo } from "react";
import {
  Search,
  Clock,
  Trash2,
  CheckSquare,
  FileText,
  Calendar,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { Application, ApplicationStatus } from "../types";
import { calculateSkillMatch } from "../utils/jobUtils";
import { formatShortDateTime, isGhostingRisk } from "../utils/pipelineUtils";

interface WarRoomPipelineProps {
  applications: Application[];
  kaptenSkills: string[];
  onSimulateGhosting: (id: string) => void;
  onDeleteApplication: (app: Application) => void;
  onSelectApplication: (app: Application) => void;
}

type SortOption = "NEWEST" | "INTERVIEW_ASC" | "OFFER_DESC";

const STATUS_BADGE_COLORS: Record<ApplicationStatus, string> = {
  WISHLIST: "bg-slate-100 text-slate-700 border-slate-300",
  APPLIED: "bg-blue-50 text-blue-700 border-blue-200",
  SCREENING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  INTERVIEW: "bg-amber-50 text-amber-800 border-amber-300",
  OFFER: "bg-emerald-50 text-emerald-700 border-emerald-300",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  GHOSTED: "bg-purple-50 text-purple-700 border-purple-200",
};

export function WarRoomPipeline({
  applications,
  kaptenSkills,
  onSimulateGhosting,
  onDeleteApplication,
  onSelectApplication,
}: WarRoomPipelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApplicationStatus>(
    "ALL"
  );
  const [onlyGhosting, setOnlyGhosting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");

  const processedApps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = applications
      .map((app) => ({
        app,
        ghosting: isGhostingRisk(app),
        matchScore: calculateSkillMatch(kaptenSkills, app.requiredSkills).score,
      }))
      .filter(({ app, ghosting }) => {
        const matchesStatus =
          statusFilter === "ALL" || app.status === statusFilter;
        const matchesGhosting = !onlyGhosting || ghosting;
        const matchesText =
          !query ||
          app.company.toLowerCase().includes(query) ||
          app.role.toLowerCase().includes(query) ||
          (app.cvVersion && app.cvVersion.toLowerCase().includes(query));

        return matchesStatus && matchesGhosting && matchesText;
      });

    filtered.sort((a, b) => {
      if (sortBy === "INTERVIEW_ASC") {
        const timeA = a.app.interviewDateTime
          ? new Date(a.app.interviewDateTime).getTime()
          : Number.POSITIVE_INFINITY;
        const timeB = b.app.interviewDateTime
          ? new Date(b.app.interviewDateTime).getTime()
          : Number.POSITIVE_INFINITY;
        return timeA - timeB;
      }

      if (sortBy === "OFFER_DESC") {
        const offerA = a.app.salaryOffer ?? -1;
        const offerB = b.app.salaryOffer ?? -1;
        return offerB - offerA;
      }

      return (
        new Date(b.app.lastUpdatedAt).getTime() -
        new Date(a.app.lastUpdatedAt).getTime()
      );
    });

    return filtered;
  }, [
    applications,
    kaptenSkills,
    searchQuery,
    statusFilter,
    onlyGhosting,
    sortBy,
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari perusahaan, posisi, atau versi CV..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | ApplicationStatus)
            }
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="WISHLIST">WISHLIST</option>
            <option value="APPLIED">APPLIED</option>
            <option value="SCREENING">SCREENING</option>
            <option value="INTERVIEW">INTERVIEW</option>
            <option value="OFFER">OFFER</option>
            <option value="REJECTED">REJECTED</option>
            <option value="GHOSTED">GHOSTED</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="NEWEST">Update Terbaru</option>
            <option value="INTERVIEW_ASC">Jadwal Interview Terdekat</option>
            <option value="OFFER_DESC">Offer Tertinggi</option>
          </select>

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 select-none">
            <input
              type="checkbox"
              checked={onlyGhosting}
              onChange={(e) => setOnlyGhosting(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs font-semibold text-slate-700">
              Hanya Rawan Ghosting
            </span>
          </label>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <Briefcase className="w-9 h-9 text-slate-400 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-slate-800">
            Belum Ada Lamaran di Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Simpan lowongan dari tab Eksplorasi Lowongan atau klik "+ Catat
            Lamaran".
          </p>
        </div>
      ) : processedApps.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Tidak ada lamaran yang cocok dengan filter saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedApps.map(({ app, ghosting, matchScore }) => {
            const doneCount = app.checklist.filter((c) => c.done).length;
            const totalChecklist = app.checklist.length;
            const canSimulateGhosting =
              app.status === "APPLIED" || app.status === "SCREENING";

            return (
              <article
                key={app.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          STATUS_BADGE_COLORS[app.status]
                        }`}
                      >
                        {app.status}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {matchScore}% Match
                      </span>

                      {ghosting && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Rawan Ghosting
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteApplication(app)}
                      title="Hapus lamaran"
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    onClick={() => onSelectApplication(app)}
                    className="mt-3 cursor-pointer group"
                  >
                    <p className="text-xs font-semibold text-slate-500">
                      {app.company} • {app.workMode}
                    </p>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5 mt-0.5">
                      <span>{app.role}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    </h3>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      Checklist: {doneCount}/{totalChecklist}
                    </span>

                    {app.cvVersion && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {app.cvVersion}
                      </span>
                    )}

                    {app.interviewDateTime && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatShortDateTime(app.interviewDateTime)}
                      </span>
                    )}

                    {typeof app.salaryOffer === "number" &&
                      app.salaryOffer > 0 && (
                        <span className="font-semibold text-emerald-700">
                          Rp {app.salaryOffer.toLocaleString("id-ID")}
                        </span>
                      )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectApplication(app)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Detail & Tahap Seleksi
                  </button>

                  {canSimulateGhosting && (
                    <button
                      type="button"
                      onClick={() => onSimulateGhosting(app.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg inline-flex items-center gap-1 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Simulasi +15 Hari
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}