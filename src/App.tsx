import { useState } from "react";
import { Plus, Compass, Layers, Scale } from "lucide-react";
import type {
  Application,
  JobListing,
  NewManualApplicationInput,
} from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { inferWorkMode, isDuplicateApplication } from "./utils/jobUtils";
import { JobExplorer } from "./components/JobExplorer";
import { ManualApplicationModal } from "./components/ManualApplicationModal";

type ActiveTab = "EXPLORE" | "PIPELINE" | "COMPARATOR";

const DEFAULT_KAPTEN_SKILLS = ["React", "TypeScript", "CSS"];

export function App() {
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    "aku_mw_magang_skills",
    DEFAULT_KAPTEN_SKILLS
  );
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "aku_mw_magang_applications",
    []
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("EXPLORE");
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  const handleAddSkill = (newSkill: string): boolean => {
    const exists = kaptenSkills.some(
      (s) => s.trim().toLowerCase() === newSkill.trim().toLowerCase()
    );
    if (exists) return false;
    setKaptenSkills((prev) => [...prev, newSkill.trim()]);
    return true;
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setKaptenSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveJobToWishlist = (job: JobListing) => {
    if (isDuplicateApplication(applications, job.company_name, job.title)) {
      return;
    }

    const now = new Date().toISOString();
    const newApp: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkMode(job.candidate_required_location),
      status: "WISHLIST",
      requiredSkills: job.tags,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: "Disimpan ke Wishlist dari Katalog Lowongan",
        },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);
  };

  const handleAddManualApplication = (input: NewManualApplicationInput) => {
    if (isDuplicateApplication(applications, input.company, input.role)) {
      return;
    }

    const now = new Date().toISOString();
    const logMessage =
      input.status === "APPLIED"
        ? `Lamaran dikirim (CV: ${input.cvVersion})`
        : "Ditambahkan manual ke Wishlist";

    const newApp: Application = {
      id: crypto.randomUUID(),
      company: input.company,
      role: input.role,
      workMode: input.workMode,
      status: input.status,
      requiredSkills: input.requiredSkills,
      cvVersion: input.cvVersion,
      appliedDate: input.appliedDate,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: logMessage,
        },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);
  };

  const offerCount = applications.filter((a) => a.status === "OFFER").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-blue-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="bg-white text-blue-900 font-extrabold text-xs px-2 py-1 rounded">
              AM
            </span>
            <h1 className="font-bold text-base sm:text-lg tracking-tight">
              Aku Mw Magang
            </h1>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("EXPLORE")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                activeTab === "EXPLORE"
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Compass className="w-4 h-4" />
              Eksplorasi Lowongan
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PIPELINE")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                activeTab === "PIPELINE"
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              Pipeline Lamaran ({applications.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("COMPARATOR")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
                activeTab === "COMPARATOR"
                  ? "bg-blue-700 text-white"
                  : "text-blue-100 hover:bg-blue-800"
              }`}
            >
              <Scale className="w-4 h-4" />
              Bandingkan Offer ({offerCount})
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-900 text-xs sm:text-sm font-bold rounded-lg inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Catat Lamaran
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "EXPLORE" && (
          <JobExplorer
            kaptenSkills={kaptenSkills}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            applications={applications}
            onSaveToWishlist={handleSaveJobToWishlist}
          />
        )}

        {activeTab === "PIPELINE" && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h2 className="text-base font-bold text-slate-800">
              Slot Komponen Orang 2: War Room Pipeline & Detail Lamaran
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Total lamaran tersimpan di localStorage saat ini:{" "}
              <strong>{applications.length}</strong>
            </p>
          </div>
        )}

        {activeTab === "COMPARATOR" && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h2 className="text-base font-bold text-slate-800">
              Slot Komponen Orang 3: Offer Comparator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Total lamaran berstatus OFFER saat ini:{" "}
              <strong>{offerCount}</strong>
            </p>
          </div>
        )}
      </main>

      <ManualApplicationModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        applications={applications}
        onSubmitApplication={handleAddManualApplication}
      />
    </div>
  );
}

export default App;