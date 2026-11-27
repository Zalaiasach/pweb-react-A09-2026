import { useEffect, useMemo, useState } from "react";
import type { Application, ApplicationStatus, ChecklistItem } from "../types";
import { calculateSkillMatch } from "../utils/jobUtils";
import { formatShortDateTime, getAllowedNextStatuses } from "../utils/pipelineUtils";

interface ApplicationDetailModalProps {
  application: Application;
  kaptenSkills: string[];
  onClose: () => void;
  onUpdate: (id: string, update: Partial<Application>, logMessage?: string) => void;
}

const INTERVIEW_QUESTIONS = [
  "Ceritakan tentang diri dan pengalamanmu yang relevan dengan posisi ini.",
  "Ceritakan proyek teknologi yang paling kamu banggakan dan tantangannya.",
  "Bagaimana cara kamu belajar teknologi atau tools yang belum pernah digunakan?",
  "Ceritakan pengalaman bekerja dalam tim dan menyelesaikan perbedaan pendapat.",
  "Mengapa kamu tertarik magang di perusahaan dan posisi ini?",
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist", APPLIED: "Applied", SCREENING: "Screening",
  INTERVIEW: "Interview", OFFER: "Offer", REJECTED: "Rejected", GHOSTED: "Ghosted",
};

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function ApplicationDetailModal({ application, kaptenSkills, onClose, onUpdate }: ApplicationDetailModalProps) {
  const [nextStatus, setNextStatus] = useState<ApplicationStatus | "">("");
  const [cvVersion, setCvVersion] = useState(application.cvVersion ?? "");
  const [appliedDate, setAppliedDate] = useState(application.appliedDate ?? "");
  const [interviewDateTime, setInterviewDateTime] = useState(application.interviewDateTime ?? "");
  const [salaryOffer, setSalaryOffer] = useState(application.salaryOffer?.toString() ?? "");
  const [workMode, setWorkMode] = useState(application.workMode);
  const [transitionError, setTransitionError] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [timerDeadline, setTimerDeadline] = useState<number | null>(null);

  const allowedStatuses = useMemo(() => getAllowedNextStatuses(application.status), [application.status]);
  const skillMatch = calculateSkillMatch(kaptenSkills, application.requiredSkills);

  useEffect(() => {
    if (timerDeadline === null) return;
    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) setTimerDeadline(null);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [timerDeadline]);

  const handleTransition = () => {
    if (!nextStatus) return;
    if ((nextStatus === "APPLIED" && (!cvVersion.trim() || !appliedDate)) ||
        (nextStatus === "INTERVIEW" && !interviewDateTime) ||
        (nextStatus === "OFFER" && (!Number.isFinite(Number(salaryOffer)) || Number(salaryOffer) <= 0))) {
      setTransitionError("Lengkapi data wajib untuk status yang dipilih.");
      return;
    }
    const update: Partial<Application> = { status: nextStatus };
    if (nextStatus === "APPLIED") { update.cvVersion = cvVersion.trim(); update.appliedDate = appliedDate; }
    if (nextStatus === "INTERVIEW") update.interviewDateTime = interviewDateTime;
    if (nextStatus === "OFFER") { update.salaryOffer = Number(salaryOffer); update.workMode = workMode; }
    onUpdate(application.id, update, `Status berubah: ${STATUS_LABELS[application.status]} → ${STATUS_LABELS[nextStatus]}`);
    setNextStatus("");
    setTransitionError("");
  };

  const addChecklistItem = () => {
    const text = checklistText.trim();
    if (!text) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), text, done: false };
    onUpdate(application.id, { checklist: [...application.checklist, item] });
    setChecklistText("");
  };

  const toggleChecklistItem = (itemId: string) => {
    const item = application.checklist.find((entry) => entry.id === itemId);
    if (!item) return;
    onUpdate(application.id, { checklist: application.checklist.map((entry) => entry.id === itemId ? { ...entry, done: !entry.done } : entry) });
  };

  const deleteChecklistItem = (itemId: string) => {
    onUpdate(application.id, { checklist: application.checklist.filter((entry) => entry.id !== itemId) });
  };

  const addNote = () => {
    const note = noteText.trim();
    if (!note) return;
    onUpdate(application.id, {}, `Catatan: ${note}`);
    setNoteText("");
  };

  const completedCount = application.checklist.filter((item) => item.done).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="application-detail-title" className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-start z-10">
          <div><p className="text-xs text-slate-500">{application.company} · {application.workMode}</p><h2 id="application-detail-title" className="text-lg font-bold">{application.role}</h2></div>
          <button type="button" onClick={onClose} className="text-sm text-blue-700 font-semibold">Tutup</button>
        </header>
        <div className="p-6 grid gap-6 md:grid-cols-2">
          <section className="space-y-3">
            <h3 className="font-bold">Tahap seleksi</h3>
            <p className="text-sm text-slate-600">Status: <strong>{STATUS_LABELS[application.status]}</strong> · Skill Match {skillMatch.score}%</p>
            {application.cvVersion && <p className="text-sm text-slate-600">Versi CV: {application.cvVersion}</p>}
            {application.appliedDate && <p className="text-sm text-slate-600">Tanggal lamar: {application.appliedDate}</p>}
            {application.interviewDateTime && <p className="text-sm text-slate-600">Interview: {formatShortDateTime(application.interviewDateTime)}</p>}
            {allowedStatuses.length > 0 ? <>
              <label className="block text-xs font-semibold">Pindah status
                <select value={nextStatus} onChange={(event) => { setNextStatus(event.target.value as ApplicationStatus | ""); setTransitionError(""); }} className="mt-1 w-full border rounded-lg p-2 bg-white">
                  <option value="">Pilih status tujuan</option>
                  {allowedStatuses.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
                </select>
              </label>
              {nextStatus === "APPLIED" && <div className="grid grid-cols-2 gap-2"><input aria-label="Versi CV" value={cvVersion} onChange={(event) => setCvVersion(event.target.value)} placeholder="Versi CV" className="border rounded-lg p-2 text-sm"/><input aria-label="Tanggal lamar" type="date" value={appliedDate} onChange={(event) => setAppliedDate(event.target.value)} className="border rounded-lg p-2 text-sm"/></div>}
              {nextStatus === "INTERVIEW" && <input aria-label="Tanggal dan waktu interview" type="datetime-local" value={interviewDateTime} onChange={(event) => setInterviewDateTime(event.target.value)} className="w-full border rounded-lg p-2 text-sm"/>}
              {nextStatus === "OFFER" && <div className="grid grid-cols-2 gap-2"><input aria-label="Gaji offer" type="number" min="1" value={salaryOffer} onChange={(event) => setSalaryOffer(event.target.value)} placeholder="Gaji (Rp)" className="border rounded-lg p-2 text-sm"/><select aria-label="Mode kerja" value={workMode} onChange={(event) => setWorkMode(event.target.value as Application["workMode"])} className="border rounded-lg p-2 text-sm bg-white"><option>Remote</option><option>Hybrid</option><option>Onsite</option></select></div>}
              {transitionError && <p role="alert" className="text-xs text-rose-600">{transitionError}</p>}
              {nextStatus && <button type="button" onClick={handleTransition} className="px-3 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold">Simpan Perubahan Status</button>}
            </> : <p className="text-xs text-slate-500">Status ini bersifat final.</p>}
          </section>

          <section className="space-y-3">
            <h3 className="font-bold">Checklist Persiapan <span className="text-sm font-normal text-slate-500">{completedCount}/{application.checklist.length}</span></h3>
            {application.checklist.length > 0 && <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(completedCount / application.checklist.length) * 100}%` }}/></div>}
            <ul className="space-y-2">{application.checklist.map((item) => <li key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(item.id)}/><span className={item.done ? "line-through text-slate-400 flex-1" : "flex-1"}>{item.text}</span><button type="button" onClick={() => deleteChecklistItem(item.id)} className="text-xs text-rose-600">Hapus</button></li>)}</ul>
            <form onSubmit={(event) => { event.preventDefault(); addChecklistItem(); }} className="flex gap-2"><input value={checklistText} onChange={(event) => setChecklistText(event.target.value)} placeholder="Tambah item checklist" className="min-w-0 flex-1 border rounded-lg p-2 text-sm"/><button className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-semibold">Tambah</button></form>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold">Latihan Interview</h3>
            <p className="text-xs text-slate-500">Pertanyaan {questionIndex + 1} dari {INTERVIEW_QUESTIONS.length}</p>
            <p className="text-sm min-h-10">{INTERVIEW_QUESTIONS[questionIndex]}</p>
            <p aria-live="polite" className="text-3xl font-mono font-bold text-blue-800">{formatTimer(secondsLeft)}</p>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setTimerDeadline((deadline) => deadline === null ? Date.now() + secondsLeft * 1000 : null)} disabled={secondsLeft === 0} className="px-3 py-2 bg-blue-700 text-white rounded-lg text-sm">{timerDeadline !== null ? "Pause" : "Start"}</button><button type="button" onClick={() => { setTimerDeadline(null); setSecondsLeft(120); }} className="px-3 py-2 bg-slate-100 rounded-lg text-sm">Reset</button><button type="button" onClick={() => { setTimerDeadline(null); setQuestionIndex((index) => (index + 1) % INTERVIEW_QUESTIONS.length); setSecondsLeft(120); }} className="px-3 py-2 bg-slate-100 rounded-lg text-sm">Soal Berikutnya</button></div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold">Activity Log</h3>
            <form onSubmit={(event) => { event.preventDefault(); addNote(); }} className="flex gap-2"><input value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Tulis catatan..." className="min-w-0 flex-1 border rounded-lg p-2 text-sm"/><button className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-semibold">Catat</button></form>
            <ol className="max-h-48 overflow-y-auto space-y-2">{[...application.activityLogs].reverse().map((log) => <li key={log.id} className="border-l-2 border-blue-200 pl-3"><p className="text-sm">{log.message}</p><time className="text-xs text-slate-500">{formatShortDateTime(log.timestamp)}</time></li>)}</ol>
          </section>
        </div>
      </section>
    </div>
  );
}
