import { generateTransactionTableHTML } from "../ui/transaction/transactionTableGenerator.js";

describe("transaction table generator", () => {
  test("renders table with rows and expected headers", () => {
    const txs = [
      { id: "t1", date: "2024-01-02", description: "A", category: "Food", income: 0, expenses: 10, currency: "USD" },
      { id: "t2", date: "2024-02-03", description: "B", category: "Transport", income: 5, expenses: 0, currency: "EUR" },
    ];

    // Minimal AppState shape consumed by the generator
    global.AppState = {
      categories: { Food: { color: "#f00" }, Transport: { color: "#0f0" } },
    };

    const html = generateTransactionTableHTML(txs);
    expect(html).toContain("Transaction Data (2 transactions)");
    expect(html).toContain("<table class=\"transaction-table\">");
    expect(html).toContain("<th>Date</th>");
    expect(html).toContain("<th>Description</th>");
    expect(html).toContain("<th>Category</th>");
    expect(html).toContain("<th>Income</th>");
    expect(html).toContain("<th>Expenses</th>");
    expect(html).toContain("<th>Currency</th>");
    expect(html).toContain('data-transaction-id="t1"');
    expect(html).toContain('data-transaction-id="t2"');
  });
});
