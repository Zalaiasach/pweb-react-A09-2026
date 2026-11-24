import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, X, Database, Wifi } from "lucide-react";
import type { DataSourceMode } from "../types";

interface SkillProfileCardProps {
  skills: string[];
  onAddSkill: (skill: string) => boolean;
  onRemoveSkill: (skill: string) => void;
  dataSource: DataSourceMode;
  onChangeDataSource: (mode: DataSourceMode) => void;
}

export function SkillProfileCard({
  skills,
  onAddSkill,
  onRemoveSkill,
  dataSource,
  onChangeDataSource,
}: SkillProfileCardProps) {
  const [skillInput, setSkillInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) {
      setErrorMsg("Nama skill tidak boleh kosong.");
      return;
    }

    const added = onAddSkill(trimmed);
    if (!added) {
      setErrorMsg(`Skill "${trimmed}" sudah ada di profil.`);
      return;
    }

    setSkillInput("");
    setErrorMsg("");
  };

  return (
    <aside className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-slate-800">
          Profil Skill Kapten
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Digunakan untuk menghitung persentase kecocokan tiap lowongan.
        </p>

        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            placeholder="Tambah skill (mis. Docker)..."
            className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg inline-flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{errorMsg}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {skill}
              <button
                type="button"
                onClick={() => onRemoveSkill(skill)}
                aria-label={`Hapus skill ${skill}`}
                className="text-blue-500 hover:text-red-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <hr className="border-slate-200" />

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Sumber Data Lowongan
        </h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="dataSource"
              checked={dataSource === "live"}
              onChange={() => onChangeDataSource("live")}
              className="text-blue-600"
            />
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-slate-700">
              Remotive API (Live)
            </span>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
            <input
              type="radio"
              name="dataSource"
              checked={dataSource === "fallback"}
              onChange={() => onChangeDataSource("fallback")}
              className="text-blue-600"
            />
            <Database className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-slate-700">
              Dataset Magang ID (Lokal)
            </span>
          </label>
        </div>
      </div>
    </aside>
  );
}