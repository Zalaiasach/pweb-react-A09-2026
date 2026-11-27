import { RotateCcw, X } from "lucide-react";
import type { Application } from "../types";

interface UndoToastProps {
  deletedApp: Application | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({
  deletedApp,
  onUndo,
  onDismiss,
}: UndoToastProps) {
  if (!deletedApp) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 max-w-md">
      <p className="text-xs sm:text-sm">
        Lamaran <strong className="font-semibold">{deletedApp.company}</strong>{" "}
        telah dihapus.
      </p>

      <button
        type="button"
        onClick={onUndo}
        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Undo (5 detik)
      </button>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        className="text-slate-400 hover:text-white p-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
