// src/components/charts/InventoryChart.jsx
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function InventoryChart({ data = [] }) {
  const chartData = {
    labels: data.map((d) => d.name || ""),
    datasets: [
      {
        label: "Current Stock",
        data: data.map((d) => d.stock || 0),
        backgroundColor: "#1E293B",
        borderRadius: 8,
      },
      {
        label: "Safety Stock",
        data: data.map((d) => d.safetyStock || 0),
        backgroundColor: "#FACC15",
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        grid: {
          color: "#E2E8F0",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
