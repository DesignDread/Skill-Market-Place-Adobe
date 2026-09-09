'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SeverityChart({ summary }) {
  const { theme } = useTheme();
  const [chartColors, setChartColors] = useState({
    critical: '#ff6b86',
    high: '#ffad66',
    medium: '#f4d06f',
    low: '#63b3ed',
    border: '#07111f',
    text: '#e8f0f7'
  });

  useEffect(() => {
    // Read the exact computed CSS variables corresponding to the current theme
    const root = getComputedStyle(document.documentElement);
    setChartColors({
      critical: root.getPropertyValue('--severity-critical').trim() || '#ff6b86',
      high: root.getPropertyValue('--severity-high').trim() || '#ffad66',
      medium: root.getPropertyValue('--severity-medium').trim() || '#f4d06f',
      low: root.getPropertyValue('--severity-low').trim() || '#63b3ed',
      border: root.getPropertyValue('--background').trim() || '#07111f',
      text: root.getPropertyValue('--foreground').trim() || '#e8f0f7'
    });
  }, [theme]); // Re-run when the theme changes

  if (!summary) return null;

  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [summary.critical || 0, summary.high || 0, summary.medium || 0, summary.low || 0],
        backgroundColor: [
          chartColors.critical,
          chartColors.high,
          chartColors.medium,
          chartColors.low,
        ],
        borderColor: chartColors.border,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: 'bottom', labels: { color: chartColors.text } },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  return (
    <div className="h-64 relative">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{summary.total_findings || 0}</div>
          <div className="text-xs text-muted-foreground">Findings</div>
        </div>
      </div>
    </div>
  );
}
