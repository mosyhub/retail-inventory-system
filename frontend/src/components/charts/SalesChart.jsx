// src/components/charts/SalesChart.jsx
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SalesChart({ data = [] }) {
  const chartData = {
    labels: data.map((d) => d.date || ""),
    datasets: [
      {
        label: "Revenue (₱)",
        data: data.map((d) => d.revenue || 0),
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#2563EB",
        fill: true,
        tension: 0.4,
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
      title: {
        display: false,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
