// Card che rappresenta un singolo task nelle colonne del gruppo.
// Ripensa il task come "focus ledger": gerarchia forte, tempo evidente e azione primaria dominante.
import Button from '../UI/Button';

const formatCalendarStack = (value) => {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return {
      weekday: 'Day',
      month: 'Date',
      day: '--',
      fullDate: value || 'No date',
    };
  }

  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
    fullDate: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
  };
};

const formatCompletedLabel = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const today = getTodayDate();

  if (String(value).slice(0, 10) === today) {
    return 'Completed today';
  }

  if (Number.isNaN(date.getTime())) {
    return `Completed ${String(value).slice(0, 10)}`;
  }

  return `Completed ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
};

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PRIORITY_LABELS = {
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
};

function TaskItem({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  timerLabel,
  isTimerRunning,
  isActiveTimer,
}) {
  const { weekday, month, day, fullDate } = formatCalendarStack(task.scheduledDate);
  const today = getTodayDate();
  const isOverdue = !task.completed && Boolean(task.scheduledDate) && task.scheduledDate < today;
  const stateLabel = task.completed
    ? formatCompletedLabel(task.completedAt)
    : isActiveTimer
      ? 'Active now'
      : isOverdue
        ? 'Overdue'
        : '';
  const noteExists = Boolean(task.note?.trim());
  const descExists = Boolean(task.desc?.trim());
  const hasTimer = Number(task.timer) > 0;
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority;
  const progressSummary = task.completed
    ? 'Completed'
    : isActiveTimer
      ? 'In focus'
      : isOverdue
        ? 'Catch up now'
        : task.scheduledDate === today
          ? 'Due today'
          : 'On track';

  return (
    <article
      className={`task-item task-item--${task.priority} ${task.completed ? 'task-item--completed' : ''} ${
        isActiveTimer ? 'task-item--active' : ''
      }`.trim()}
    >
      <div className="task-item__date-panel" aria-label={`Scheduled for ${fullDate}`}>
        <span className="task-item__date-month">{month}</span>
        <span className="task-item__date-number">{day}</span>
        <span className="task-item__date-weekday">{weekday}</span>
      </div>

      <div className="task-item__main">
        <div className="task-item__topline">
          <div className="task-item__headline">
            <div className="task-item__eyebrow">
              <span className="task-item__group-dot" aria-hidden="true" />
              <span className={`priority-badge priority-badge--${task.priority}`}>{priorityLabel}</span>
              {stateLabel ? (
                <span
                  className={`task-item__state-chip ${task.completed ? 'task-item__state-chip--completed' : ''} ${
                    isOverdue ? 'task-item__state-chip--overdue' : ''
                  }`.trim()}
                >
                  {stateLabel}
                </span>
              ) : null}
            </div>
            <h3 className="task-item__title">{task.title}</h3>
          </div>
        </div>

        <div className="task-item__facts">
          <div className="task-item__fact">
            <span className="task-item__fact-icon" aria-hidden="true">
              <i className="bi bi-flag-fill" />
            </span>
            <div className="task-item__fact-copy">
              <span className="task-item__fact-label">Priority</span>
              <strong className="task-item__fact-value">{priorityLabel}</strong>
            </div>
          </div>

          <div className={`task-item__fact ${isActiveTimer ? 'task-item__fact--active' : ''}`.trim()}>
            <span className="task-item__fact-icon" aria-hidden="true">
              <i className={`bi ${hasTimer ? 'bi-hourglass-split' : 'bi-stopwatch'}`} />
            </span>
            <div className="task-item__fact-copy">
              <span className="task-item__fact-label">Focus</span>
              <strong className="task-item__fact-value">
                {hasTimer ? `${timerLabel} / ${task.timer}m` : 'No timer planned'}
              </strong>
            </div>
          </div>

          <div
            className={`task-item__fact ${
              task.completed
                ? 'task-item__fact--completed'
                : isOverdue
                  ? 'task-item__fact--alert'
                  : isActiveTimer
                    ? 'task-item__fact--active'
                    : ''
            }`.trim()}
          >
            <span className="task-item__fact-icon" aria-hidden="true">
              <i
                className={`bi ${
                  task.completed
                    ? 'bi-check2-circle'
                    : isOverdue
                      ? 'bi-exclamation-diamond'
                      : isActiveTimer
                        ? 'bi-lightning-charge-fill'
                        : 'bi-calendar2-check'
                }`}
              />
            </span>
            <div className="task-item__fact-copy">
              <span className="task-item__fact-label">Status</span>
              <strong className="task-item__fact-value">{progressSummary}</strong>
              <span className="task-item__fact-subvalue">{fullDate}</span>
            </div>
          </div>
        </div>

        {descExists ? <p className="task-item__support-text">{task.desc}</p> : null}

        {noteExists ? (
          <div className="task-item__note-strip">
            <i className="bi bi-pin-angle-fill" aria-hidden="true" />
            <p>{task.note}</p>
          </div>
        ) : null}

        <div className="task-item__footer">
          {isTimerRunning ? (
            <Button
              variant="primary"
              className="task-item__primary-action task-item__primary-action--pause"
              onClick={onPauseTimer}
              aria-label="Metti in pausa timer"
              title="Metti in pausa timer"
            >
              <i className="bi bi-pause-fill" aria-hidden="true" />
              Pause
            </Button>
          ) : (
            <Button
              variant="primary"
              className="task-item__primary-action"
              onClick={() => onStartTimer(task)}
              disabled={!hasTimer}
              aria-label="Avvia timer"
              title="Avvia timer"
            >
              <i className="bi bi-play-fill" aria-hidden="true" />
              Start focus
            </Button>
          )}

          <div className="task-item__secondary-actions">
            {hasTimer ? (
              <Button
                variant="ghost"
                className="task-item__icon-button icon-button"
                onClick={() => onResetTimer(task)}
                aria-label="Reset timer"
                title="Reset timer"
              >
                <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className="task-item__icon-button icon-button"
              onClick={() => onEdit(task)}
              aria-label="Modifica task"
              title="Modifica task"
            >
              <i className="bi bi-pencil-square" aria-hidden="true" />
            </Button>
            <Button
              variant="danger"
              className="task-item__icon-button icon-button"
              onClick={() => onDelete(task.id)}
              aria-label="Elimina task"
              title="Elimina task"
            >
              <i className="bi bi-trash3-fill" aria-hidden="true" />
            </Button>
          </div>

          <label className="task-item__check task-item__check--edge">
            <input
              className="task-item__check-input"
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleComplete(task.id)}
              aria-label={task.completed ? 'Segna task come da fare' : 'Segna task come completato'}
            />
            <span className={`task-item__check-box ${task.completed ? 'task-item__check-box--checked' : ''}`}>
              <i className="bi bi-check2" aria-hidden="true" />
            </span>
          </label>
        </div>
      </div>
    </article>
  );
}

export default TaskItem;
