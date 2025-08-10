/**
 * Returns totals by year‐month buckets.
 */
export function getMonthlyTrends(transactions = []) {
  const map = {};
  transactions.forEach((tx) => {
    if (!tx.date) return;
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    map[key] = (map[key] || 0) + ((tx.expenses || 0) - (tx.income || 0));
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, val]) => ({ month: m, net: val }));
}

/**
 * Returns average expense per category.
 */
export function getCategoryAverages(transactions = []) {
  const sum = {},
    count = {};
  transactions.forEach((tx) => {
    if (tx?.expenses && tx?.category) {
      sum[tx.category] = (sum[tx.category] || 0) + parseFloat(tx.expenses);
      count[tx.category] = (count[tx.category] || 0) + 1;
    }
  });
  return Object.keys(sum).map((cat) => ({
    category: cat,
    avg: sum[cat] / count[cat],
  }));
}

/**
 * Checks for overspend warnings vs budget thresholds.
 * @param budgets {Object} map category→budget
 */
export function getOverspendAlerts(transactions = [], budgets = {}) {
  const used = {};
  transactions.forEach((tx) => {
    if (tx?.expenses && tx?.category) {
      used[tx.category] = (used[tx.category] || 0) + parseFloat(tx.expenses);
    }
  });
  return Object.entries(budgets).reduce((alerts, [cat, budget]) => {
    const spent = used[cat] || 0;
    if (spent > budget) {
      alerts.push({ category: cat, spent, budget });
    }
    return alerts;
  }, []);
}
