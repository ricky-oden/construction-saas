import { expect, it } from "vitest";

import { allowedStatusTargets, PROJECT_STATUSES } from "@/kanban/transitions";

it("keeps the canonical six-column order and management transitions", () => {
  expect(PROJECT_STATUSES).toEqual([
    "DRAFT",
    "PLANNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
  ]);
  expect(allowedStatusTargets("PLANNED", "MANAGER")).toEqual([
    "IN_PROGRESS",
    "ON_HOLD",
    "CANCELLED",
  ]);
});

it("limits MEMBER operations to the approved transition subset", () => {
  expect(allowedStatusTargets("DRAFT", "MEMBER")).toEqual([]);
  expect(allowedStatusTargets("PLANNED", "MEMBER")).toEqual(["IN_PROGRESS"]);
  expect(allowedStatusTargets("IN_PROGRESS", "MEMBER")).toEqual([
    "ON_HOLD",
    "COMPLETED",
  ]);
});
