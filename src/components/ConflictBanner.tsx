import { AlertTriangle } from "lucide-react";
import type { ScheduleConflict } from "../utils/pipelineUtils";
import { formatShortDateTime } from "../utils/pipelineUtils";

interface ConflictBannerProps {
  conflicts: ScheduleConflict[];
}

export function ConflictBanner({ conflicts }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 mb-6 shadow-xs flex flex-col gap-1.5">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-rose-800"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong className="font-bold">Jadwal Interview Bentrok:</strong>{" "}
            <span className="font-semibold">{conflict.firstApp.company}</span> (
            {formatShortDateTime(
              conflict.firstApp.interviewDateTime as string
            )}
            ) dan{" "}
            <span className="font-semibold">{conflict.secondApp.company}</span> (
            {formatShortDateTime(
              conflict.secondApp.interviewDateTime as string
            )}
            ) berselisih kurang dari 60 menit ({conflict.diffMinutes} menit).
          </p>
        </div>
      ))}
    </div>
  );
}