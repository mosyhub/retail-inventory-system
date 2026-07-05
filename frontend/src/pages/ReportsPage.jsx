// src/pages/ReportsPage.jsx
//
// Module 6: Reports & Analytics
// Sales reports, inventory analysis, top products, category trends.
// Supports exporting generated data to PDF (via jsPDF) and CSV (Excel compatible).

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dashboard stats
  const [stats, setStats] = useState({
    today: { orders: 0, revenue: 0 },
    inventory: { totalProducts: 0, lowStock: 0, outOfStock: 0, value: 0 },
  });

  // Date filters
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Report data
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  const canViewReports = ["manager", "admin"].includes(currentUser?.role);

  useEffect(() => {
    loadDashboardStats();
    if (canViewReports) {
      loadReports();
    }
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get("/reports/dashboard-stats");
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const [salesRes, topRes, categoryRes] = await Promise.all([
        api.get("/reports/sales-report", {
          params: { startDate, endDate, groupBy: "daily" },
        }),
        api.get("/reports/top-products", { params: { startDate, endDate } }),
        api.get("/reports/sales-by-category", { params: { startDate, endDate } }),
      ]);

      setSalesData(salesRes.data.report.data || []);
      setTopProducts(topRes.data.products || []);
      setCategoryBreakdown(categoryRes.data.breakdown || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadReports = () => {
    loadReports();
  };

  // --- Export to PDF (jsPDF + AutoTable v5) ---
  const exportPDF = () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("StockWise Retail — Sales Report", 14, 15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Period: ${startDate}  to  ${endDate}`, 14, 22);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
      doc.setTextColor(0);

      // Section 1: Daily Sales
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Sales Summary", 14, 36);
      const salesBody = salesData.map((d) => [
        d.date,
        d.orders,
        `PHP ${Number(d.revenue).toLocaleString()}`,
      ]);
      autoTable(doc, {
        startY: 39,
        head: [["Date", "Orders", "Total Revenue"]],
        body: salesBody.length > 0 ? salesBody : [["No data", "", ""]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      // Section 2: Top Products
      const afterSales = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Top Selling Products", 14, afterSales);
      const productBody = topProducts.map((p, idx) => [
        idx + 1,
        p.productName,
        p.sku,
        p.quantity,
        `PHP ${Number(p.revenue).toLocaleString()}`,
      ]);
      autoTable(doc, {
        startY: afterSales + 3,
        head: [["Rank", "Product Name", "SKU", "Qty Sold", "Revenue"]],
        body: productBody.length > 0 ? productBody : [["No data", "", "", "", ""]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      // Section 3: Category Breakdown
      const afterProducts = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Sales by Category", 14, afterProducts);
      const catBody = categoryBreakdown.map((c) => [
        c.category,
        c.quantity,
        `PHP ${Number(c.revenue).toLocaleString()}`,
      ]);
      autoTable(doc, {
        startY: afterProducts + 3,
        head: [["Category", "Qty Sold", "Total Revenue"]],
        body: catBody.length > 0 ? catBody : [["No data", "", ""]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`StockWise-Report_${startDate}_to_${endDate}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Error generating PDF report: " + err.message);
    }
  };

  // --- Export to Excel-compatible CSV (Blob download) ---
  const exportCSV = () => {
    try {
      const rows = [];

      rows.push(["StockWise Retail — Sales Report"]);
      rows.push([`Period: ${startDate} to ${endDate}`]);
      rows.push([`Generated: ${new Date().toLocaleString()}`]);
      rows.push([]);

      // Daily Sales
      rows.push(["DAILY SALES SUMMARY"]);
      rows.push(["Date", "Orders", "Total Revenue (PHP)"]);
      if (salesData.length === 0) {
        rows.push(["No data available", "", ""]);
      } else {
        salesData.forEach((d) => rows.push([d.date, d.orders, Number(d.revenue).toFixed(2)]));
      }
      rows.push([]);

      // Top Products
      rows.push(["TOP SELLING PRODUCTS"]);
      rows.push(["Rank", "Product Name", "SKU", "Qty Sold", "Revenue (PHP)"]);
      if (topProducts.length === 0) {
        rows.push(["No data available", "", "", "", ""]);
      } else {
        topProducts.forEach((p, idx) =>
          rows.push([idx + 1, p.productName, p.sku, p.quantity, Number(p.revenue).toFixed(2)])
        );
      }
      rows.push([]);

      // Category Breakdown
      rows.push(["SALES BY CATEGORY"]);
      rows.push(["Category", "Qty Sold", "Revenue (PHP)"]);
      if (categoryBreakdown.length === 0) {
        rows.push(["No data available", "", ""]);
      } else {
        categoryBreakdown.forEach((c) =>
          rows.push([c.category, c.quantity, Number(c.revenue).toFixed(2)])
        );
      }

      // Build CSV string — wrap values with commas or quotes in double-quotes
      const escape = (val) => {
        const str = String(val ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      };
      const csvString = rows.map((row) => row.map(escape).join(",")).join("\r\n");

      // BOM for Excel UTF-8 recognition
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `StockWise-Report_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Export failed:", err);
      alert("Error exporting CSV: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">View sales trends, inventory analysis, and business metrics</p>
        </div>

        {canViewReports && !loading && (
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              📄 Export PDF
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              📊 Export Excel/CSV
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Today's Orders</p>
          <p className="text-3xl font-black text-blue-600 mt-2">{stats.today.orders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Today's Revenue</p>
          <p className="text-3xl font-black text-green-600 mt-2">₱{stats.today.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Products</p>
          <p className="text-3xl font-black text-purple-600 mt-2">{stats.inventory.totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Inventory Value</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">₱{stats.inventory.value.toLocaleString()}</p>
        </div>
      </div>

      {/* Report Controls - Only for managers/admins */}
      {canViewReports && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Generate Period Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleLoadReports}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold text-sm cursor-pointer"
              >
                Load Reports
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Content */}
      {canViewReports && (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-sm font-medium">Loading reports...</div>
          ) : (
            <div className="space-y-6">
              {/* Sales Trend */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Sales Trend</h2>
                <div className="h-64 flex items-end justify-between gap-2 bg-gray-50 rounded p-4">
                  {salesData.length === 0 ? (
                    <div className="w-full text-center text-gray-500 text-sm">No sales data for selected period</div>
                  ) : (
                    salesData.map((data, idx) => {
                      const maxRevenue = Math.max(...salesData.map((d) => d.revenue));
                      const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                          <div
                            className="bg-blue-500 rounded-t w-full hover:bg-blue-600 transition cursor-pointer"
                            style={{ height: `${height}%`, minHeight: "4px" }}
                            title={`${data.date}: ₱${data.revenue.toFixed(2)}`}
                          />
                          <span className="text-[10px] text-gray-500 mt-2 font-medium">{data.date.split("-").slice(1).join("-")}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Top Selling Products</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {topProducts.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-xs">
                              No sales data
                            </td>
                          </tr>
                        ) : (
                          topProducts.map((product, idx) => (
                            <tr key={product.productId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-900">{idx + 1}</td>
                              <td className="px-4 py-3 text-gray-900">
                                <p className="font-semibold">{product.productName}</p>
                                <p className="text-xs text-gray-500">{product.sku}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{product.quantity}</td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                ₱{product.revenue.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sales by Category */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h2>
                  <div className="space-y-4">
                    {categoryBreakdown.length === 0 ? (
                      <p className="text-center text-gray-500 text-sm py-8">No category data available</p>
                    ) : (
                      categoryBreakdown.map((category) => {
                        const maxRevenue = Math.max(...categoryBreakdown.map((c) => c.revenue));
                        const width = maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0;
                        return (
                          <div key={category.category} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-700">{category.category}</span>
                              <span className="text-gray-950">₱{category.revenue.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-500">{category.quantity} items sold</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Access Restricted */}
      {!canViewReports && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-semibold">
            📊 Detailed reports are available for managers and administrators only.
          </p>
          <p className="text-xs text-yellow-600 mt-1">Current Role: {currentUser?.role?.replace("_", " ")}</p>
        </div>
      )}
    </div>
  );
}
