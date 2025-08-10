import { parseCSVRow } from "../parsers/fileHandler.js";
import { parseCSVText } from "../utils/csv.js";

describe("parseCSVRow", () => {
  test("handles simple comma splits", () => {
    expect(parseCSVRow("a,b,c")).toEqual(["a", "b", "c"]);
  });
  test("handles quoted commas and escaped quotes", () => {
    // Use backslash-escaped quotes within the quoted field; the backslash must be escaped in JS
    const row = '"a,1","b\\"2",c';
    expect(parseCSVRow(row)).toEqual(["a,1", "b\"2", "c"]);
  });
  test("trims spaces and ignores empty trailing fields", () => {
    expect(parseCSVRow(" a , b , ")).toEqual(["a", "b"]);
  });
  test("parses multi-line CSV text", () => {
    const text = `a,b\n"x,1",y\n"q"w",z`;
    expect(parseCSVText(text)).toEqual([
      ["a", "b"],
      ["x,1", "y"],
      ['q"w', 'z']
    ]);
  });
  test("handles empty fields and spaces within quotes", () => {
    const row = '" a ",,"b c",d';
    expect(parseCSVRow(row)).toEqual(["a", "b c", "d"]);
  });
});
