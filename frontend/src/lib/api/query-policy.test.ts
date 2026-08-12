import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api/errors";
import { shouldRetryQuery } from "@/lib/api/query-policy";

const response = {
  error: {
    code: "INVALID",
    message: "Invalid",
    field_errors: [],
    conflict: null,
  },
};

describe("query retry policy", () => {
  it("never retries a 4xx business response", () => {
    expect(shouldRetryQuery(0, new ApiClientError(422, response))).toBe(false);
  });

  it("bounds retries for server or network failures", () => {
    expect(shouldRetryQuery(0, new Error("network"))).toBe(true);
    expect(shouldRetryQuery(2, new Error("network"))).toBe(false);
  });
});
