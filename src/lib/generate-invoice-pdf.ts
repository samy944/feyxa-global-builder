import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceOrder {
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  currency: string;
  coupon_code: string | null;
  shipping_city: string | null;
  shipping_quarter: string | null;
  shipping_address: string | null;
  shipping_phone: string | null;
  notes: string | null;
  customers: {
    first_name: string;
    last_name: string | null;
    phone: string;
    email: string | null;
    city: string | null;
  } | null;
  order_items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    variant_name: string | null;
  }[];
}

interface StoreInfo {
  name: string;
  city?: string | null;
  currency: string;
}

const fmt = (v: number, cur: string) =>
  cur === "XOF" ? `${v.toLocaleString("fr-FR")} FCFA` : `€${v.toFixed(2)}`;

export function generateInvoicePDF(order: InvoiceOrder, store: StoreInfo) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(store.name.toUpperCase(), 14, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (store.city) doc.text(store.city, 14, 28);

  doc.setFontSize(24);
  doc.text("FACTURE", pageWidth - 14, 20, { align: "right" });
  doc.setFontSize(10);
  doc.text(`#${order.order_number}`, pageWidth - 14, 28, { align: "right" });

  // Date & Status
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  const dateStr = new Date(order.created_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.text(`Date: ${dateStr}`, 14, 52);

  // Customer info
  const customerName = order.customers
    ? `${order.customers.first_name} ${order.customers.last_name || ""}`.trim()
    : "Client";
  const phone = order.customers?.phone || order.shipping_phone || "";

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Facturer à", 14, 65);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  let y = 72;
  doc.text(customerName, 14, y);
  if (phone) { y += 6; doc.text(phone, 14, y); }
  if (order.customers?.email) { y += 6; doc.text(order.customers.email, 14, y); }

  // Shipping info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Livraison", pageWidth / 2, 65);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  let yShip = 72;
  const addr = [order.shipping_address, order.shipping_quarter, order.shipping_city].filter(Boolean).join(", ");
  if (addr) { doc.text(addr, pageWidth / 2, yShip); yShip += 6; }
  if (order.shipping_phone) { doc.text(order.shipping_phone, pageWidth / 2, yShip); }

  // Items table
  const tableY = Math.max(y, yShip) + 16;
  const tableData = order.order_items.map((item) => [
    item.product_name + (item.variant_name ? ` (${item.variant_name})` : ""),
    item.quantity.toString(),
    fmt(item.unit_price, order.currency),
    fmt(item.unit_price * item.quantity, order.currency),
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [["Produit", "Qté", "Prix unitaire", "Total"]],
    body: tableData,
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 14;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Sous-total", totalsX - 50, finalY);
  doc.text(fmt(order.subtotal, order.currency), totalsX, finalY, { align: "right" });

  let tY = finalY;
  if (order.shipping_cost > 0) {
    tY += 7;
    doc.text("Livraison", totalsX - 50, tY);
    doc.text(fmt(order.shipping_cost, order.currency), totalsX, tY, { align: "right" });
  }
  if (order.discount_amount > 0) {
    tY += 7;
    doc.setTextColor(59, 130, 246);
    doc.text(`Réduction${order.coupon_code ? ` (${order.coupon_code})` : ""}`, totalsX - 50, tY);
    doc.text(`-${fmt(order.discount_amount, order.currency)}`, totalsX, tY, { align: "right" });
  }

  tY += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX - 80, tY - 3, totalsX, tY - 3);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL", totalsX - 50, tY + 2);
  doc.text(fmt(order.total, order.currency), totalsX, tY + 2, { align: "right" });

  // Notes
  if (order.notes) {
    tY += 20;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Notes:", 14, tY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(order.notes, 14, tY + 6, { maxWidth: pageWidth - 28 });
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Facture générée le ${new Date().toLocaleDateString("fr-FR")} · ${store.name}`, pageWidth / 2, pageH - 10, { align: "center" });

  doc.save(`facture-${order.order_number}.pdf`);
}
