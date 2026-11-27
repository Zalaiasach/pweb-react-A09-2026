import type { Application, ApplicationStatus } from "../types";

export interface ScheduleConflict {
  id: string;
  firstApp: Application;
  secondApp: Application;
  diffMinutes: number;
}

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ["APPLIED", "REJECTED"],
  APPLIED: ["SCREENING", "GHOSTED", "REJECTED"],
  SCREENING: ["INTERVIEW", "GHOSTED", "REJECTED"],
  INTERVIEW: ["OFFER", "GHOSTED", "REJECTED"],
  GHOSTED: ["SCREENING", "REJECTED"],
  OFFER: [],
  REJECTED: [],
};

export function getAllowedNextStatuses(
  currentStatus: ApplicationStatus
): ApplicationStatus[] {
  return VALID_TRANSITIONS[currentStatus];
}

export function canTransitionStatus(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function isGhostingRisk(app: Application): boolean {
  if (app.status !== "APPLIED" && app.status !== "SCREENING") {
    return false;
  }

  const lastUpdated = new Date(app.lastUpdatedAt).getTime();
  if (Number.isNaN(lastUpdated)) return false;

  const diffDays = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24);
  return diffDays > 14;
}

export function detectInterviewConflicts(
  applications: Application[]
): ScheduleConflict[] {
  const interviews = applications.filter(
    (app) => app.status === "INTERVIEW" && Boolean(app.interviewDateTime)
  );

  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < interviews.length; i++) {
    for (let j = i + 1; j < interviews.length; j++) {
      const appA = interviews[i];
      const appB = interviews[j];

      const timeA = new Date(appA.interviewDateTime as string).getTime();
      const timeB = new Date(appB.interviewDateTime as string).getTime();

      if (Number.isNaN(timeA) || Number.isNaN(timeB)) continue;

      const diffMinutes = Math.abs(timeA - timeB) / (1000 * 60);
      if (diffMinutes < 60) {
        conflicts.push({
          id: `${appA.id}-${appB.id}`,
          firstApp: appA,
          secondApp: appB,
          diffMinutes: Math.round(diffMinutes),
        });
      }
    }
  }

  return conflicts;
}

export function formatShortDateTime(isoOrLocal: string): string {
  const date = new Date(isoOrLocal);
  if (Number.isNaN(date.getTime())) return isoOrLocal;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}