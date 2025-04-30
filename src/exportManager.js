export function exportMergedFilesAsCSV() {
  const allRows = [];
  const headers = ["Date", "Description", "Category", "Amount"];
  allRows.push(headers);

  AppState.transactions.forEach(tx => {
    allRows.push([
      tx.date || "",
      tx.description || "",
      tx.category || "",
      tx.amount || ""
    ]);
  });

  const csvContent = allRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "merged_transactions.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}