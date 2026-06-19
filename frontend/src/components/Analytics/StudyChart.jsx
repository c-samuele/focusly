// Contenitore della sezione analytics.
// Coordina card riepilogative, selezione periodo e il grafico appropriato.
import Button from '../UI/Button';
import { formatMinutes } from '../../utils/timeFormat';
import { getGroupAccentStyle } from '../../utils/groupAppearance';
import StudyDayPieChart from './StudyDayPieChart';
import StudyHistoryChart from './StudyHistoryChart';

const PERIOD_LABELS = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

const formatScheduledLabel = (value, period) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (period === 'year') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (period === 'month' || period === 'week') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
};

function StudyChart({
  stats,
  period,
  onPeriodChange,
  historyStats,
  periodTasks,
  theme,
  activeTaskId,
  isRunning,
  onStartTimer,
  onPauseTimer,
  onShiftBackward,
  onShiftForward,
  canShiftForward,
  showBreakdown = true,
}) {
  const isDayView = period === 'day';

  return (
    <section className="analytics panel workspace-screen workspace-screen--analytics">
      <div className="analytics__toolbar">
        <div className="analytics__filters">
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <Button
              key={value}
              variant={period === value ? 'primary' : 'ghost'}
              className="analytics__filter-button"
              onClick={() => onPeriodChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="analytics__period-nav" aria-label="Period navigation">
          <Button
            variant="ghost"
            className="analytics__nav-button icon-button"
            onClick={onShiftBackward}
            aria-label="View previous period"
            title="View previous period"
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </Button>

          <div className="analytics__period-label">
            <span>{stats.isCurrentPeriod ? 'Current selection' : 'Selected period'}</span>
            <strong>{stats.periodLabel}</strong>
          </div>

          <Button
            variant="ghost"
            className="analytics__nav-button icon-button"
            onClick={onShiftForward}
            disabled={!canShiftForward}
            aria-label="View next period"
            title={canShiftForward ? 'View next period' : 'Already on the latest available period'}
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="analytics__body">
        <div className={`analytics__summary ${showBreakdown ? 'analytics__summary--split' : 'analytics__summary--single'}`}>
          <div className="analytics-card analytics-card--today">
            <div className="analytics-card__today-header">
              <div>
                <span>{stats.periodLabel}</span>
                <p className="analytics-card__meta">{period === 'day' ? 'Open tasks scheduled for this day.' : 'Open tasks still planned in this period.'}</p>
              </div>
              <strong className="analytics-card__today-count">{periodTasks.length}</strong>
            </div>
            {periodTasks.length === 0 ? (
              <p className="analytics-card__meta">No open tasks scheduled in this period.</p>
            ) : (
              <div className="analytics-today-list">
                {periodTasks.map((task) => (
                  <article
                    key={task.id}
                    className={`analytics-today-item ${activeTaskId === task.id ? 'analytics-today-item--active' : ''}`}
                    style={getGroupAccentStyle(task.groupColor)}
                  >
                    <div className="analytics-today-item__content">
                      <div className="analytics-today-item__topline">
                        <span className="analytics-today-item__group">{task.groupName}</span>
                        <span className="analytics-today-item__date">{formatScheduledLabel(task.scheduledDate, period)}</span>
                      </div>
                      <p className="analytics-today-item__title">{task.title}</p>
                      <div className="analytics-today-item__footer">
                        <span className={`priority-badge priority-badge--${task.priority}`}>{task.priority}</span>
                        <small className="analytics-today-item__timer">
                          <i className="bi bi-clock" aria-hidden="true" /> {task.timer} min
                        </small>
                      </div>
                    </div>

                    <Button
                      variant={isRunning && activeTaskId === task.id ? 'ghost' : 'primary'}
                      className="icon-button analytics-today-item__play"
                      onClick={() => (
                        isRunning && activeTaskId === task.id
                          ? onPauseTimer?.()
                          : onStartTimer?.(task)
                      )}
                      disabled={task.timer <= 0}
                      aria-label={isRunning && activeTaskId === task.id ? 'Metti in pausa timer' : 'Avvia timer del task'}
                      title={isRunning && activeTaskId === task.id ? 'Metti in pausa timer' : 'Avvia timer del task'}
                    >
                      <i
                        className={`bi ${isRunning && activeTaskId === task.id ? 'bi-pause-fill' : 'bi-play-fill'}`}
                        aria-hidden="true"
                      />
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </div>
          {showBreakdown ? (
            isDayView
              ? <StudyDayPieChart stats={stats} theme={theme} />
              : <StudyHistoryChart stats={historyStats} theme={theme} />
          ) : null}
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
          <div className="analytics-card analytics-card--metric">
            <span>Completed tasks</span>
            <strong>{stats.totalCompletedTasks}</strong>
            <p className="analytics-card__meta">Finished during {stats.periodLabel}.</p>
          </div>
          <div className="analytics-card analytics-card--metric">
            <span>Open tasks</span>
            <strong>{stats.totalPendingTasks}</strong>
            <p className="analytics-card__meta">{stats.totalTasks} total tasks in this period.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudyChart;
