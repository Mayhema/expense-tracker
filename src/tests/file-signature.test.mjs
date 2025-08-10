import { generateFileSignature, getSignatureString } from "../parsers/fileHandler.js";

describe("file signature generation", () => {
  test("structure-based signature ignores file extension", () => {
    const data = [
      ["Date", "Description", "Amount"],
      ["2024-01-01", "Coffee", "-3.20"],
      ["2024-01-02", "Salary", "1000"],
    ];

    const sigCsv = generateFileSignature("test.csv", data);
    const sigXlsx = generateFileSignature("test.xlsx", data);

    expect(typeof sigCsv).toBe("string");
    expect(sigCsv.startsWith("struct_"));
    expect(sigCsv).toEqual(sigXlsx);
  });

  test("getSignatureString returns a usable string for objects", () => {
    const sigObj = { structureSig: "abc", mappingSig: "def" };
    expect(getSignatureString(sigObj)).toBe("abc");
  });
});
