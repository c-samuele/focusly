// Grafico a ciambella per la distribuzione delle ore di studio del giorno per gruppo.
import { useEffect, useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatMinutes, hoursToMinutes } from '../../utils/timeFormat';
import { normalizeGroupColor } from '../../utils/groupAppearance';

function StudyDayPieChart({ stats, theme = 'light' }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const activeGroups = useMemo(
    () => stats.groupStats
      .filter((item) => item.studyHours > 0)
      .map((item) => ({
        ...item,
        color: normalizeGroupColor(item.color, `${item.groupId}|${item.groupName}`),
      })),
    [stats.groupStats]
  );
  const segmentBorderColor = theme === 'dark' ? '#152235' : '#E8EEF7';

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
            backgroundColor: activeGroups.map((item) => item.color),
            borderColor: segmentBorderColor,
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
  }, [activeGroups, segmentBorderColor]);

  if (activeGroups.length === 0) {
    return (
      <div className="history-card day-breakdown-card">
        <div className="day-breakdown-card__empty">
          <p>No completed study time recorded for this day yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-card day-breakdown-card">
      <div className="day-breakdown-card__body">
        <div className="day-breakdown-card__canvas">
          <canvas ref={canvasRef} />
        </div>

        <div className="day-breakdown-legend">
          {activeGroups.map((item) => (
            <article key={item.groupId} className="day-breakdown-legend__item">
              <span
                className="day-breakdown-legend__swatch"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <div>
                <strong>{item.groupName}</strong>
                <p>{formatMinutes(item.studyMinutes)} logged</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudyDayPieChart;
