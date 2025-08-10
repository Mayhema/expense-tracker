import { parseCSVRow } from "../parsers/fileHandler.js";

describe("parseCSVRow", () => {
  test("handles simple comma splits", () => {
    expect(parseCSVRow("a,b,c")).toEqual(["a", "b", "c"]);
  });
  test("handles quoted commas and escaped quotes", () => {
    const row = '"a,1","b\"2",c';
    expect(parseCSVRow(row)).toEqual(["a,1", "b\"2", "c"]);
  });
  test("trims spaces and ignores empty trailing fields", () => {
    expect(parseCSVRow(" a , b , ")).toEqual(["a", "b"]);
  });
});
