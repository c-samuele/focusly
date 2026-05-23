// Grafico a ciambella per la distribuzione delle ore di studio del giorno per gruppo.
import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatMinutes, hoursToMinutes } from '../../utils/timeFormat';

const CHART_COLORS = ['#2557a7', '#ef7d57', '#3aa889', '#7a5af8', '#f2b134', '#2f6fed', '#d95f8d'];

function StudyDayPieChart({ stats }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const activeGroups = useMemo(
    () => stats.groupStats.filter((item) => item.studyHours > 0),
    [stats.groupStats]
  );

  useEffect(() => {
    if (!canvasRef.current || activeGroups.length === 0) {
      return undefined;
    }

    // Distruggiamo sempre l'istanza precedente per evitare memory leak
    // e conflitti con Chart.js durante i rerender.
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: activeGroups.map((item) => item.groupName),
        datasets: [
          {
            data: activeGroups.map((item) => item.studyHours),
            backgroundColor: activeGroups.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
            borderColor: '#e8eef7',
            borderWidth: 1,
            hoverOffset: 30,
          },
        ],
      },
      options: {
        responsive: true,
        layout: {
                  padding: 30,
                },
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${formatMinutes(hoursToMinutes(context.parsed))}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [activeGroups]);

  if (activeGroups.length === 0) {
    return (
      <div className="history-card day-breakdown-card">
        <div className="history-card__header">
          <div>
            <span>Today by Group</span>
            <strong>0 min</strong>
            <p>No completed study time recorded yet for today.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-card day-breakdown-card">
      <div className="history-card__header">
        <div>
          <span>Today by Group</span>
          <strong>{formatMinutes(stats.totalMinutes)}</strong>
          <p>{stats.totalCompletedTasks} completed tasks</p>
        </div>
      </div>

      <div className="day-breakdown-card__body">
        <div className="day-breakdown-card__canvas">
          <canvas ref={canvasRef} />
        </div>

        <div className="day-breakdown-legend">
          {activeGroups.map((item, index) => (
            <article key={item.groupId} className="day-breakdown-legend__item">
              <span
                className="day-breakdown-legend__swatch"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                aria-hidden="true"
              />
              <div>
                <strong>{item.groupName}</strong>
                <p>{formatMinutes(item.studyMinutes)} today</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudyDayPieChart;
