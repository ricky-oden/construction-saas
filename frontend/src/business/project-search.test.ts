import { describe, expect, it } from "vitest";

import {
  defaultProjectSearch,
  projectSearchFromUrl,
  projectSearchToUrl,
} from "@/business/project-search";
import { businessKeys } from "@/business/query-keys";

describe("project search parameters", () => {
  it("restores every supported condition from a URL", () => {
    const restored = projectSearchFromUrl(
      new URLSearchParams(
        "name=Central&status=IN_PROGRESS&customer_id=2&property_id=3&assignee_id=4&" +
          "period_from=2026-01-01&period_to=2026-01-31&sort=start_date&" +
          "order=asc&page=4&page_size=50",
      ),
    );
    expect(restored).toEqual({
      name: "Central",
      status: "IN_PROGRESS",
      customer_id: 2,
      property_id: 3,
      assignee_id: 4,
      period_from: "2026-01-01",
      period_to: "2026-01-31",
      sort: "start_date",
      order: "asc",
      page: 4,
      page_size: 50,
    });
  });

  it("uses safe defaults for unsupported URL values", () => {
    expect(
      projectSearchFromUrl(
        new URLSearchParams(
          "status=UNKNOWN&sort=description&order=sideways&page=0&page_size=101",
        ),
      ),
    ).toEqual(defaultProjectSearch);
  });

  it("round-trips non-default conditions without noisy defaults", () => {
    const conditions = { ...defaultProjectSearch, name: "Renovation", page: 2 };
    expect(projectSearchToUrl(conditions)).toBe("name=Renovation&page=2");
  });

  it("includes every result-changing condition in the query key", () => {
    const key = businessKeys.projects.list({
      ...defaultProjectSearch,
      name: "Central",
      status: "DRAFT",
      customer_id: 1,
      property_id: 2,
      assignee_id: 4,
      period_from: "2026-01-01",
      period_to: "2026-01-31",
      sort: "code",
      order: "asc",
      page: 3,
      page_size: 50,
    });
    expect(key[2]).toEqual({
      name: "Central",
      status: "DRAFT",
      customer_id: 1,
      property_id: 2,
      assignee_id: 4,
      period_from: "2026-01-01",
      period_to: "2026-01-31",
      sort: "code",
      order: "asc",
      page: 3,
      page_size: 50,
    });
    expect(businessKeys.projects.list(defaultProjectSearch)).not.toEqual(key);
  });
});
