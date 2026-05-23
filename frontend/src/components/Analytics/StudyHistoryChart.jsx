// Grafico storico lineare delle ore di studio aggregate per periodo.
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatMinutes, hoursToMinutes } from '../../utils/timeFormat';

function StudyHistoryChart({ stats }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    // Ogni aggiornamento ricrea il grafico a partire dai dati già aggregati dal service.
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: stats.labels,
        datasets: [
          {
            label: 'Study Hours',
            data: stats.hours,
            borderColor: '#00b62a',
            backgroundColor: 'rgba(17, 255, 0, 0.14)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => formatMinutes(hoursToMinutes(context.parsed.y)),
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatMinutes(hoursToMinutes(value)),
            },
            title: {
              display: true,
              text: 'Duration',
            },
          },
          x: {
            title: {
              display: true,
              text: stats.axisLabel,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [stats]);

  return (
    <div className="history-card">
      <div className="history-card__header">
        <div>
          <span>{stats.title}</span>
          <strong>{formatMinutes(stats.totalMinutes)}</strong>
          <p>{stats.totalCompletedTasks} completed tasks</p>
        </div>
      </div>
      <div className="history-card__canvas">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default StudyHistoryChart;
