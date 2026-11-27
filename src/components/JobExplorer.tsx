import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  BookmarkPlus,
  Building2,
  MapPin,
} from "lucide-react";
import type { Application, DataSourceMode, JobListing } from "../types";
import { fetchJobListings } from "../services/jobService";
import { useDebounce } from "../hooks/useDebounce";
import {
  calculateSkillMatch,
  inferWorkMode,
  isDuplicateApplication,
} from "../utils/jobUtils";
import { SkillProfileCard } from "./SkillProfileCard";

interface JobExplorerProps {
  kaptenSkills: string[];
  onAddSkill: (skill: string) => boolean;
  onRemoveSkill: (skill: string) => void;
  applications: Application[];
  onSaveToWishlist: (job: JobListing) => void;
}

export function JobExplorer({
  kaptenSkills,
  onAddSkill,
  onRemoveSkill,
  applications,
  onSaveToWishlist,
}: JobExplorerProps) {
  const [dataSource, setDataSource] = useState<DataSourceMode>("live");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  const [keyword, setKeyword] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"MATCH_DESC" | "DEFAULT">("MATCH_DESC");

  const debouncedKeyword = useDebounce<string>(keyword, 400);

  useEffect(() => {
    const controller = new AbortController();

    fetchJobListings(dataSource, controller.signal)
      .then((data) => {
        setJobs(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data lowongan.";
        setError(message);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [dataSource, retryTrigger]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryTrigger((prev) => prev + 1);
  };

  const handleChangeDataSource = (mode: DataSourceMode) => {
    setSelectedCategory("ALL");
    setIsLoading(true);
    setError(null);
    if (mode === dataSource) {
      setRetryTrigger((prev) => prev + 1);
    } else {
      setDataSource(mode);
    }
  };

  const categories = useMemo(() => {
    const unique = new Set(jobs.map((job) => job.category));
    return ["ALL", ...Array.from(unique)];
  }, [jobs]);

  const filteredAndSortedJobs = useMemo(() => {
    const query = debouncedKeyword.trim().toLowerCase();

    const withScores = jobs
      .filter((job) => {
        const matchesCategory =
          selectedCategory === "ALL" || job.category === selectedCategory;
        const matchesQuery =
          !query ||
          job.title.toLowerCase().includes(query) ||
          job.company_name.toLowerCase().includes(query) ||
          job.tags.some((tag) => tag.toLowerCase().includes(query));
        return matchesCategory && matchesQuery;
      })
      .map((job) => ({
        job,
        match: calculateSkillMatch(kaptenSkills, job.tags),
      }));

    if (sortBy === "MATCH_DESC") {
      withScores.sort((a, b) => b.match.score - a.match.score);
    }

    return withScores;
  }, [jobs, debouncedKeyword, selectedCategory, sortBy, kaptenSkills]);

  const getBadgeStyle = useCallback((score: number) => {
    if (score >= 70) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (score >= 40) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-rose-50 text-rose-700 border-rose-200";
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-4">
        <SkillProfileCard
          skills={kaptenSkills}
          onAddSkill={onAddSkill}
          onRemoveSkill={onRemoveSkill}
          dataSource={dataSource}
          onChangeDataSource={handleChangeDataSource}
        />
      </div>

      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari posisi, perusahaan, atau skill..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "ALL" ? "Semua Kategori" : cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "MATCH_DESC" | "DEFAULT")
            }
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MATCH_DESC">Match Tertinggi</option>
            <option value="DEFAULT">Urutan Default</option>
          </select>
        </div>

        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">
              Memuat daftar lowongan magang...
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-rose-800">
              Gagal Memuat Lowongan
            </h3>
            <p className="text-xs text-rose-700 mt-1 mb-4">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Lagi
              </button>
              {dataSource === "live" && (
                <button
                  type="button"
                  onClick={() => setDataSource("fallback")}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Gunakan Fallback Lokal
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && !error && filteredAndSortedJobs.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada lowongan yang sesuai filter pencarian.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Coba ubah kata kunci atau pilih kategori lain.
            </p>
          </div>
        )}

        {!isLoading && !error && filteredAndSortedJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAndSortedJobs.map(({ job, match }) => {
              const alreadyApplied = isDuplicateApplication(
                applications,
                job.company_name,
                job.title
              );
              const matchedSet = new Set(
                match.matchedSkills.map((s) => s.toLowerCase())
              );

              return (
                <article
                  key={job.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{job.company_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {job.candidate_required_location} (
                            {inferWorkMode(job.candidate_required_location)})
                          </span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(
                          match.score
                        )}`}
                      >
                        {match.score}% Match
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-2">
                      {job.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.tags.map((tag) => {
                        const isMatched = matchedSet.has(tag.toLowerCase());
                        return (
                          <span
                            key={tag}
                            title={isMatched ? "Skill Cocok" : "Missing Skill"}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              isMatched
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-600 border-rose-200"
                            }`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {job.salary || "Gaji kompetitif"}
                    </span>

                    <button
                      type="button"
                      disabled={alreadyApplied}
                      onClick={() => onSaveToWishlist(job)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 ${
                        alreadyApplied
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {alreadyApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sudah Dilamar
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Simpan ke Wishlist
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
