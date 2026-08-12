import { beforeEach, expect, it, vi } from "vitest";

import { businessApi } from "@/business/api";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ apiRequest: request }));

beforeEach(() => request.mockReset());

it("loads every paginated project for the visible Gantt range", async () => {
  request
    .mockResolvedValueOnce({ items: [{ id: 1 }], page: 1, total_pages: 2 })
    .mockResolvedValueOnce({ items: [{ id: 2 }], page: 2, total_pages: 2 });

  await expect(
    businessApi.ganttProjects("2026-01-01", "2026-01-31"),
  ).resolves.toEqual([{ id: 1 }, { id: 2 }]);
  expect(request).toHaveBeenNthCalledWith(
    1,
    "/projects?period_from=2026-01-01&period_to=2026-01-31&sort=start_date&order=asc&page=1&page_size=100",
  );
  expect(request).toHaveBeenNthCalledWith(
    2,
    "/projects?period_from=2026-01-01&period_to=2026-01-31&sort=start_date&order=asc&page=2&page_size=100",
  );
});

it("loads every authorized active project for the Kanban board in stable order", async () => {
  request
    .mockResolvedValueOnce({ items: [{ id: 1 }], page: 1, total_pages: 2 })
    .mockResolvedValueOnce({ items: [{ id: 2 }], page: 2, total_pages: 2 });

  await expect(businessApi.kanbanProjects()).resolves.toEqual([
    { id: 1 },
    { id: 2 },
  ]);
  expect(request).toHaveBeenNthCalledWith(
    1,
    "/projects?sort=start_date&order=asc&page=1&page_size=100",
  );
  expect(request).toHaveBeenNthCalledWith(
    2,
    "/projects?sort=start_date&order=asc&page=2&page_size=100",
  );
});
