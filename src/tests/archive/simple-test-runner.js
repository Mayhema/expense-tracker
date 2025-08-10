import { describe, test, expect } from "@jest/globals";

describe("simple-test-runner", () => {
  test("should pass minimal test", () => {
    expect(true).toBe(true);
  });
});
