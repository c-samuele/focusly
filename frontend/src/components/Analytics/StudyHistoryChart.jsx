// Grafico storico lineare delle ore di studio aggregate per periodo.
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatMinutes, hoursToMinutes } from '../../utils/timeFormat';
import { hexToRgba } from '../../utils/groupAppearance';

const HISTORY_THEME = {
  light: {
    line: '#2C8FB8',
    lineFill: hexToRgba('#5AB8D6', 0.24),
    point: '#1E6C88',
    grid: 'rgba(43, 92, 131, 0.12)',
    tick: '#58708A',
  },
  dark: {
    line: '#7FD6EE',
    lineFill: hexToRgba('#49BCD7', 0.2),
    point: '#C3F6FF',
    grid: 'rgba(150, 201, 219, 0.18)',
    tick: '#B5C7D8',
  },
};

function StudyHistoryChart({ stats, theme = 'light' }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const showHeader = stats.period === 'day';
  const centeredTimeline = stats.period !== 'day';
  const chartTheme = HISTORY_THEME[theme] ?? HISTORY_THEME.light;

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
            borderColor: chartTheme.line,
            backgroundColor: chartTheme.lineFill,
            fill: true,
            tension: 0.34,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: chartTheme.point,
            pointBorderColor: chartTheme.line,
            pointBorderWidth: 2,
            pointHoverBackgroundColor: chartTheme.point,
            pointHoverBorderColor: chartTheme.point,
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
            border: {
              color: chartTheme.grid,
            },
            grid: {
              color: chartTheme.grid,
              drawBorder: false,
            },
            ticks: {
              color: chartTheme.tick,
              callback: (value) => formatMinutes(hoursToMinutes(value)),
            },
            title: {
              display: true,
              text: 'Duration',
              color: chartTheme.tick,
            },
          },
          x: {
            border: {
              color: chartTheme.grid,
            },
            grid: {
              color: chartTheme.grid,
              drawBorder: false,
            },
            ticks: {
              color: chartTheme.tick,
            },
            title: {
              display: true,
              text: stats.axisLabel,
              color: chartTheme.tick,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [chartTheme, stats]);

  return (
    <div className={`history-card ${centeredTimeline ? 'history-card--timeline' : ''}`.trim()}>
      {showHeader ? (
        <div className="history-card__header">
          <div>
            <span>{stats.title}</span>
            <strong>{formatMinutes(stats.totalMinutes)}</strong>
            <p>{stats.totalCompletedTasks} completed tasks</p>
          </div>
        </div>
      ) : null}
      <div className="history-card__canvas">
        {centeredTimeline ? (
          <div className="history-card__canvas-inner">
            <canvas ref={canvasRef} />
          </div>
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>
    </div>
  );
}

export default StudyHistoryChart;
