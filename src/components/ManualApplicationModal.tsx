import { useState, useRef } from "react";
import type { FormEvent, RefObject } from "react";
import { X, AlertTriangle } from "lucide-react";
import type {
  Application,
  NewManualApplicationInput,
  WorkMode,
} from "../types";
import { isDuplicateApplication } from "../utils/jobUtils";

interface ManualApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  onSubmitApplication: (input: NewManualApplicationInput) => void;
}

interface FormErrors {
  company?: string;
  role?: string;
  requiredSkills?: string;
  cvVersion?: string;
  appliedDate?: string;
  duplicate?: string;
}

export function ManualApplicationModal({
  isOpen,
  onClose,
  applications,
  onSubmitApplication,
}: ManualApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Remote");
  const [status, setStatus] = useState<"WISHLIST" | "APPLIED">("WISHLIST");
  const [skillsText, setSkillsText] = useState("");
  const [cvVersion, setCvVersion] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const companyRef = useRef<HTMLInputElement | null>(null);
  const roleRef = useRef<HTMLInputElement | null>(null);
  const skillsRef = useRef<HTMLInputElement | null>(null);
  const cvVersionRef = useRef<HTMLInputElement | null>(null);
  const appliedDateRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setCompany("");
    setRole("");
    setWorkMode("Remote");
    setStatus("WISHLIST");
    setSkillsText("");
    setCvVersion("");
    setAppliedDate("");
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    let firstInvalidRef: RefObject<HTMLInputElement | null> | null = null;

    if (!company.trim()) {
      newErrors.company = "Nama perusahaan wajib diisi.";
      if (!firstInvalidRef) firstInvalidRef = companyRef;
    }

    if (!role.trim()) {
      newErrors.role = "Posisi / Role wajib diisi.";
      if (!firstInvalidRef) firstInvalidRef = roleRef;
    }

    const parsedSkills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (parsedSkills.length === 0) {
      newErrors.requiredSkills =
        "Minimal masukkan 1 skill (pisahkan dengan koma).";
      if (!firstInvalidRef) firstInvalidRef = skillsRef;
    }

    if (status === "APPLIED") {
      if (!cvVersion.trim()) {
        newErrors.cvVersion =
          "Versi CV wajib diisi jika status awal APPLIED.";
        if (!firstInvalidRef) firstInvalidRef = cvVersionRef;
      }
      if (!appliedDate.trim()) {
        newErrors.appliedDate =
          "Tanggal lamar wajib diisi jika status awal APPLIED.";
        if (!firstInvalidRef) firstInvalidRef = appliedDateRef;
      }
    }

    if (
      company.trim() &&
      role.trim() &&
      isDuplicateApplication(applications, company, role)
    ) {
      newErrors.duplicate = `Lamaran untuk "${role.trim()}" di "${company.trim()}" sudah tercatat.`;
      if (!firstInvalidRef) firstInvalidRef = companyRef;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (firstInvalidRef && firstInvalidRef.current) {
        firstInvalidRef.current.focus();
      }
      return;
    }

    onSubmitApplication({
      company: company.trim(),
      role: role.trim(),
      workMode,
      status,
      requiredSkills: parsedSkills,
      cvVersion: status === "APPLIED" ? cvVersion.trim() : undefined,
      appliedDate: status === "APPLIED" ? appliedDate.trim() : undefined,
    });

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Catat Lamaran Manual
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errors.duplicate && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errors.duplicate}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Perusahaan *
            </label>
            <input
              ref={companyRef}
              type="text"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  company: undefined,
                  duplicate: undefined,
                }));
              }}
              placeholder="Contoh: Garuda FinTech"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.company || errors.duplicate
                  ? "border-rose-400 focus:ring-rose-500"
                  : "border-slate-300 focus:ring-blue-500"
              }`}
            />
            {errors.company && (
              <p className="text-xs text-rose-600 mt-1">{errors.company}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Posisi / Role *
            </label>
            <input
              ref={roleRef}
              type="text"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  role: undefined,
                  duplicate: undefined,
                }));
              }}
              placeholder="Contoh: Frontend Developer Intern"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.role || errors.duplicate
                  ? "border-rose-400 focus:ring-rose-500"
                  : "border-slate-300 focus:ring-blue-500"
              }`}
            />
            {errors.role && (
              <p className="text-xs text-rose-600 mt-1">{errors.role}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode Kerja
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Awal
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "WISHLIST" | "APPLIED");
                  setErrors((prev) => ({
                    ...prev,
                    cvVersion: undefined,
                    appliedDate: undefined,
                  }));
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WISHLIST">WISHLIST</option>
                <option value="APPLIED">APPLIED</option>
              </select>
            </div>
          </div>

          {status === "APPLIED" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Versi CV *
                </label>
                <input
                  ref={cvVersionRef}
                  type="text"
                  value={cvVersion}
                  onChange={(e) => {
                    setCvVersion(e.target.value);
                    setErrors((prev) => ({ ...prev, cvVersion: undefined }));
                  }}
                  placeholder="Contoh: Kapten-CV-v2.pdf"
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 ${
                    errors.cvVersion
                      ? "border-rose-400 focus:ring-rose-500"
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                />
                {errors.cvVersion && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.cvVersion}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lamar *
                </label>
                <input
                  ref={appliedDateRef}
                  type="date"
                  value={appliedDate}
                  onChange={(e) => {
                    setAppliedDate(e.target.value);
                    setErrors((prev) => ({ ...prev, appliedDate: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 ${
                    errors.appliedDate
                      ? "border-rose-400 focus:ring-rose-500"
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                />
                {errors.appliedDate && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.appliedDate}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Required Skills (pisahkan dengan koma) *
            </label>
            <input
              ref={skillsRef}
              type="text"
              value={skillsText}
              onChange={(e) => {
                setSkillsText(e.target.value);
                setErrors((prev) => ({ ...prev, requiredSkills: undefined }));
              }}
              placeholder="React, TypeScript, CSS, Docker"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.requiredSkills
                  ? "border-rose-400 focus:ring-rose-500"
                  : "border-slate-300 focus:ring-blue-500"
              }`}
            />
            {errors.requiredSkills && (
              <p className="text-xs text-rose-600 mt-1">
                {errors.requiredSkills}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Simpan Lamaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}