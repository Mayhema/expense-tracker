import { ensureTransactionIds } from "../parsers/fileHandler.js";

describe("ensureTransactionIds", () => {
  test("assigns unique IDs when missing or duplicated", () => {
    const input = [
      { amount: 10 },
      { amount: 20, id: "dup" },
      { amount: 30, id: "dup" },
    ];
    const out = ensureTransactionIds(input);
    expect(out.every((t) => typeof t.id === "string" && t.id.length > 0)).toBe(true);
    const ids = new Set(out.map((t) => t.id));
    expect(ids.size).toBe(out.length);
  });

  test("preserves existing unique IDs", () => {
    const input = [
      { id: "a", amount: 1 },
      { id: "b", amount: 2 },
    ];
    const out = ensureTransactionIds(input);
    expect(out.map((t) => t.id)).toEqual(["a", "b"]);
  });
});
