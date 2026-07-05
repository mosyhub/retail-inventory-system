// src/components/charts/PredictionChart.jsx
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
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function PredictionChart({ data = [] }) {
  const chartData = {
    labels: data.map((d) => d.productName || ""),
    datasets: [
      {
        label: "Days Remaining",
        data: data.map((d) => (d.daysRemaining >= 999 ? 120 : d.daysRemaining)),
        borderColor: "#EF4444",
        backgroundColor: "#EF4444",
        borderWidth: 2,
        tension: 0.1,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
