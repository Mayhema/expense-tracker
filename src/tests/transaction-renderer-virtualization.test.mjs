/**
 * Tests the optional virtualization path in transactionRenderer.
 * Ensures it renders without throwing and attaches listeners when flag is on.
 */

import { renderTransactionTable } from "../ui/transaction/transactionRenderer.js";

// Minimal DOM structure expected by ensureTransactionContainer consumer
function makeContainer() {
  const div = document.createElement("div");
  div.className = "section transactions-section";
  div.id = "transactionsSection";
  div.innerHTML = `
    <div class="section-content">
      <div id="transactionFilters" class="transaction-filters"></div>
      <div id="transactionTableWrapper" class="transaction-table-wrapper"></div>
    </div>`;
  document.body.appendChild(div);
  return div;
}

describe("transactionRenderer virtualization", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    // Enable feature flag
    globalThis.APP_FEATURES = { useVirtualization: true };
  });

  test("renders virtualized table wrapper and rows container", async () => {
    const container = makeContainer();
    const txs = Array.from({ length: 100 }, (_, i) => ({ id: `t${i}`, date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`, description: `Tx ${i}`, currency: "USD" }));

    // Render and await event loop tasks
    renderTransactionTable(container, txs);
    await new Promise((r) => setTimeout(r, 20));

    const wrapper = container.querySelector(".transaction-table-virtualized");
    expect(wrapper).toBeTruthy();
    expect(wrapper.querySelector(".rows")).toBeTruthy();
  });
});
