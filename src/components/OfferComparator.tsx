import { useState } from "react";
import type { Application } from "../types";
import { calculateSkillMatch } from "../utils/jobUtils";

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
  onUpdateApplication: (
    applicationId: string,
    updates: Partial<Application>
  ) => void;
}

export function OfferComparator({
  applications,
  kaptenSkills,
  onUpdateApplication,
}: OfferComparatorProps) {
  const offers = applications.filter((app) => app.status === "OFFER");
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  const selectedApplications = offers.filter((app) =>
    selectedOffers.includes(app.id)
  );

  const getSkillMatch = (app: Application) =>
    calculateSkillMatch(kaptenSkills, app.requiredSkills);

  const formatSalary = (salary?: number) => {
    if (salary == null || !Number.isFinite(salary)) return "Belum diisi";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const toggleOffer = (id: string) => {
    setSelectedOffers((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const handleSalaryChange = (app: Application, rawValue: string) => {
    const salaryOffer = rawValue === "" ? undefined : Number(rawValue);
    if (salaryOffer !== undefined && (!Number.isFinite(salaryOffer) || salaryOffer < 0)) return;
    onUpdateApplication(app.id, {
      salaryOffer,
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  const handleRejectOffer = (app: Application) => {
    if (!window.confirm(`Tolak offer dari ${app.company}?`)) return;
    const now = new Date().toISOString();
    onUpdateApplication(app.id, {
      status: "REJECTED",
      lastUpdatedAt: now,
      activityLogs: [
        ...app.activityLogs,
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: "Offer ditolak melalui Offer Comparator",
        },
      ],
    });
    setSelectedOffers((current) => current.filter((id) => id !== app.id));
  };

  const bestSalaryOffer = offers.reduce<Application | null>((best, current) => {
    if (current.salaryOffer == null) return best;
    if (best?.salaryOffer == null) return current;
    return current.salaryOffer > best.salaryOffer ? current : best;
  }, null);

  const bestSkillOffer = offers.reduce<Application | null>((best, current) => {
    if (!best) return current;
    return getSkillMatch(current).score > getSkillMatch(best).score ? current : best;
  }, null);

  if (offers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800">Belum Ada Offer</h2>
        <p className="mt-2 text-sm text-slate-500">
          Lamaran dengan status OFFER akan ditampilkan di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900">Offer Comparator</h2>
        <p className="mt-1 text-sm text-slate-500">
          Bandingkan gaji dan kecocokan skill dari offer yang diterima.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Offer</p>
          <p className="mt-1 text-2xl font-bold">{offers.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Gaji Tertinggi</p>
          <p className="mt-1 text-lg font-bold text-green-700">
            {formatSalary(bestSalaryOffer?.salaryOffer)}
          </p>
          {bestSalaryOffer && <p className="mt-1 text-xs text-slate-500">{bestSalaryOffer.company}</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Skill Match Terbaik</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {bestSkillOffer ? `${getSkillMatch(bestSkillOffer).score}%` : "-"}
          </p>
          {bestSkillOffer && <p className="mt-1 text-xs text-slate-500">{bestSkillOffer.company}</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800">Daftar Offer</h3>
          <p className="text-xs text-slate-500">Pilih maksimal 3 offer</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {offers.map((app) => {
            const match = getSkillMatch(app);
            const selected = selectedOffers.includes(app.id);
            return (
              <article key={app.id} className={`rounded-xl border bg-white p-5 ${selected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{app.role}</h4>
                    <p className="text-sm text-slate-500">{app.company}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleOffer(app.id)}
                    disabled={!selected && selectedOffers.length >= 3}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    {selected ? "Dipilih" : "Bandingkan"}
                  </button>
                </div>

                <div className="mt-4">
                  <label htmlFor={`salary-${app.id}`} className="mb-1 block text-xs font-medium text-slate-500">
                    Salary Offer (IDR)
                  </label>
                  <input
                    id={`salary-${app.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={app.salaryOffer ?? ""}
                    onChange={(event) => handleSalaryChange(app, event.target.value)}
                    placeholder="Masukkan nominal gaji"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-sm font-semibold text-green-700">{formatSalary(app.salaryOffer)}</p>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-500">Skill Match</span>
                    <span className="font-bold">{match.score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${match.score}%` }} />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-slate-500">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.requiredSkills.length === 0 ? (
                      <span className="text-xs text-slate-400">Tidak ada required skills</span>
                    ) : app.requiredSkills.map((skill) => {
                      const matched = match.matchedSkills.some((item) => item.toLowerCase() === skill.toLowerCase());
                      return (
                        <span key={skill} className={`rounded-md px-2 py-1 text-xs ${matched ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500">{app.workMode}</span>
                  <button type="button" onClick={() => handleRejectOffer(app)} className="text-xs font-medium text-red-600 hover:text-red-800">
                    Reject Offer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedApplications.length >= 2 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="font-bold text-slate-800">Perbandingan Offer</h3>
            <p className="mt-1 text-xs text-slate-500">Membandingkan {selectedApplications.length} offer.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left font-semibold">Kriteria</th>
                  {selectedApplications.map((app) => <th key={app.id} className="min-w-48 p-4 text-left font-semibold">{app.company}</th>)}
                </tr>
              </thead>
              <tbody>
                {([
                  ["Role", (app: Application) => app.role],
                  ["Salary", (app: Application) => formatSalary(app.salaryOffer)],
                  ["Skill Match", (app: Application) => `${getSkillMatch(app).score}%`],
                  ["Work Mode", (app: Application) => app.workMode],
                  ["Matched Skills", (app: Application) => getSkillMatch(app).matchedSkills.join(", ") || "-"],
                  ["Missing Skills", (app: Application) => getSkillMatch(app).missingSkills.join(", ") || "-"],
                ] as const).map(([label, getValue]) => (
                  <tr key={label} className="border-t">
                    <td className="p-4 font-medium">{label}</td>
                    {selectedApplications.map((app) => <td key={app.id} className="p-4">{getValue(app)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedOffers.length === 1 && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          Pilih minimal satu offer lagi untuk menampilkan tabel perbandingan.
        </p>
      )}
    </div>
  );
}
