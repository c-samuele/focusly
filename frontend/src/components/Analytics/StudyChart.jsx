// Contenitore della sezione analytics.
// Coordina card riepilogative, selezione periodo e il grafico appropriato.
import Button from '../UI/Button';
import { formatMinutes } from '../../utils/timeFormat';
import StudyDayPieChart from './StudyDayPieChart';
import StudyHistoryChart from './StudyHistoryChart';

const PERIOD_LABELS = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

function StudyChart({
  stats,
  period,
  onPeriodChange,
  historyStats,
  todaysTasks,
  showBreakdown = true,
}) {
  const isDayView = period === 'day';

  return (
    <section className="analytics panel">
      <div className="analytics__header">
        <div>
          <p className="hero__eyebrow">Study Analytics</p>
          <h2>{isDayView ? 'Today by Group' : 'Total Hours by Group'}</h2>
          <p>
            {isDayView
              ? 'The pie chart shows how today study time is split across your groups.'
              : 'Only completed task time is counted in the totals.'}
          </p>
        </div>

        <div className="analytics__filters">
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <Button
              key={value}
              variant={period === value ? 'primary' : 'ghost'}
              onClick={() => onPeriodChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className={`analytics__summary ${showBreakdown ? 'analytics__summary--split' : 'analytics__summary--single'}`}>
        <div className="analytics-card analytics-card--today">
          <div className="analytics-card__today-header">
            <span>Today</span>
            <strong className="analytics-card__today-count">{todaysTasks.length}</strong>
          </div>
          {todaysTasks.length === 0 ? (
            <p className="analytics-card__meta">No open tasks scheduled for today.</p>
          ) : (
            <div className="analytics-today-list">
              {todaysTasks.map((task) => (
                <article key={task.id} className="analytics-today-item">
                  <span className="analytics-today-item__group">{task.groupName}</span>
                  <strong>{task.title}</strong>
                  <span className={`priority-badge priority-badge--${task.priority}`}>{task.priority}</span>
                  <small className="analytics-today-item__timer"><i className="bi bi-clock" aria-hidden="true" /> {task.timer} min</small>
                </article>
              ))}
            </div>
          )}
        </div>
        {showBreakdown ? (isDayView ? <StudyDayPieChart stats={stats} /> : <StudyHistoryChart stats={historyStats} />) : null}
      </div>

      <div className="analytics__totals">
        <div className="analytics-card analytics-card--progress">
          <span>Total hours expected</span>
          <strong>{formatMinutes(stats.totalPlannedMinutes)}</strong>
          <p className="analytics-card__subtext">{formatMinutes(stats.totalMinutes)} completed</p>
          <div className="analytics-progress" aria-hidden="true">
            <div
              className="analytics-progress__bar"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <p className="analytics-card__meta">{stats.completionRate}% of planned hours completed</p>
        </div>
      </div>
    </section>
  );
}

export default StudyChart;
