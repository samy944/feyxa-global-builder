import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TrendProduct {
  name: string;
  category: string | null;
  sales_period: number;
  revenue_period: number;
  growth_rate: number;
  trend_score: number;
  avg_rating: number;
}

interface CategoryTrend {
  name: string;
  sales_period: number;
  products: number;
  growth: number;
}

interface DailyPoint {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface ExportData {
  trending: TrendProduct[];
  topPeriod: TrendProduct[];
  emerging: TrendProduct[];
  categoryTrends: CategoryTrend[];
  dailyTimeSeries: DailyPoint[];
  periodDays: number;
}

function formatDate() {
  return new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- CSV Export ---

export function exportTrendsCSV(data: ExportData) {
  const period = `${data.periodDays}j`;
  const lines: string[] = [];

  // Trending products
  lines.push(`Produits en tendance (${period})`);
  lines.push("Nom,Catégorie,Ventes,Revenu (XOF),Croissance (%),Score,Note");
  data.trending.forEach((p) => {
    lines.push(
      `"${p.name}","${p.category || "-"}",${p.sales_period},${p.revenue_period},${p.growth_rate},${p.trend_score},${p.avg_rating}`
    );
  });

  lines.push("");
  lines.push(`Top produits (${period})`);
  lines.push("Nom,Catégorie,Ventes,Revenu (XOF),Croissance (%),Note");
  data.topPeriod.forEach((p) => {
    lines.push(
      `"${p.name}","${p.category || "-"}",${p.sales_period},${p.revenue_period},${p.growth_rate},${p.avg_rating}`
    );
  });

  lines.push("");
  lines.push("Produits émergents");
  lines.push("Nom,Catégorie,Ventes,Revenu (XOF),Croissance (%)");
  data.emerging.forEach((p) => {
    lines.push(
      `"${p.name}","${p.category || "-"}",${p.sales_period},${p.revenue_period},${p.growth_rate}`
    );
  });

  lines.push("");
  lines.push("Catégories");
  lines.push("Catégorie,Ventes,Produits,Croissance (%)");
  data.categoryTrends.forEach((c) => {
    lines.push(`"${c.name}",${c.sales_period},${c.products},${c.growth}`);
  });

  lines.push("");
  lines.push("Ventes quotidiennes");
  lines.push("Date,Ventes,Revenu (XOF),Commandes");
  data.dailyTimeSeries.forEach((d) => {
    lines.push(`${d.date},${d.sales},${d.revenue},${d.orders}`);
  });

  const csv = "\uFEFF" + lines.join("\n"); // BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `feyxa-trends-${period}-${formatDate()}.csv`);
}

// --- PDF Export ---

export function exportTrendsPDF(data: ExportData) {
  const period = `${data.periodDays}j`;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Feyxa Trends — Rapport", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Période : ${period} • Généré le ${formatDate()}`, 14, 25);

  // Summary
  const totalSales = data.trending.reduce((s, p) => s + p.sales_period, 0);
  const totalRevenue = data.trending.reduce((s, p) => s + p.revenue_period, 0);

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `${data.trending.length} produits en tendance  •  ${data.emerging.length} émergents  •  ${data.categoryTrends.filter((c) => c.sales_period > 0).length} catégories actives`,
    14,
    33
  );

  // Table 1: Trending products
  let startY = 40;
  doc.setFontSize(12);
  doc.text(`Produits en tendance (${period})`, 14, startY);

  autoTable(doc, {
    startY: startY + 3,
    head: [["#", "Produit", "Catégorie", "Ventes", "Revenu (XOF)", "Croissance", "Score"]],
    body: data.trending.map((p, i) => [
      i + 1,
      p.name,
      p.category || "-",
      p.sales_period,
      new Intl.NumberFormat("fr-FR").format(p.revenue_period),
      `${p.growth_rate > 0 ? "+" : ""}${p.growth_rate}%`,
      p.trend_score.toFixed(3),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    margin: { left: 14, right: 14 },
  });

  // Table 2: Categories
  const lastY = (doc as any).lastAutoTable?.finalY || 120;

  if (lastY > 160) doc.addPage();
  const catStartY = lastY > 160 ? 20 : lastY + 10;

  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text("Catégories en croissance", 14, catStartY);

  autoTable(doc, {
    startY: catStartY + 3,
    head: [["#", "Catégorie", "Ventes", "Produits", "Croissance"]],
    body: data.categoryTrends.map((c, i) => [
      i + 1,
      c.name,
      c.sales_period,
      c.products,
      `${c.growth > 0 ? "+" : ""}${c.growth}%`,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    margin: { left: 14, right: 14 },
  });

  // Table 3: Daily time series (new page)
  doc.addPage();
  doc.setFontSize(12);
  doc.text("Ventes quotidiennes", 14, 18);

  autoTable(doc, {
    startY: 22,
    head: [["Date", "Ventes (unités)", "Revenu (XOF)", "Commandes"]],
    body: data.dailyTimeSeries.map((d) => [
      new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      d.sales,
      new Intl.NumberFormat("fr-FR").format(d.revenue),
      d.orders,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    margin: { left: 14, right: 14 },
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Feyxa Trends • Page ${i}/${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`feyxa-trends-${period}-${formatDate()}.pdf`);
}
