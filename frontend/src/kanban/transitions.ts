import type { Role } from "@/auth/types";
import type { ProjectStatus } from "@/business/types";

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "DRAFT",
  "PLANNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
];

const TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
  DRAFT: ["PLANNED", "CANCELLED"],
  PLANNED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const MEMBER_TRANSITIONS = new Set([
  "PLANNED:IN_PROGRESS",
  "IN_PROGRESS:ON_HOLD",
  "ON_HOLD:IN_PROGRESS",
  "IN_PROGRESS:COMPLETED",
]);

export function allowedStatusTargets(
  source: ProjectStatus,
  role: Role,
): readonly ProjectStatus[] {
  if (role === "ADMIN" || role === "MANAGER") return TRANSITIONS[source];
  return TRANSITIONS[source].filter((target) =>
    MEMBER_TRANSITIONS.has(`${source}:${target}`),
  );
}
