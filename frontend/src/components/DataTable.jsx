// src/components/DataTable.jsx
import React, { useState } from "react";

export default function DataTable({ columns, data, loading, noDataMessage = "No records found" }) {
  const [sortConfig, setSortConfig] = useState(null);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    const sorted = [...data];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === undefined || bVal === undefined) return 0;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="w-full overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-[#1E293B]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key || col.header}
                onClick={() => col.sortable && requestSort(col.key)}
                className={`px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider ${
                  col.sortable ? "cursor-pointer select-none hover:bg-slate-700" : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{col.header}</span>
                  {col.sortable && sortConfig?.key === col.key && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 text-sm">
                Loading records...
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 text-sm">
                {noDataMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key || col.header} className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
