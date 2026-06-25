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

const PRIORITY_HINTS = {
  low: 'Flexible slot',
  medium: 'Keep momentum',
  high: 'Do first',
};

function TaskItem({
  task,
  groupName,
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
  const noteExists = Boolean(task.note?.trim());
  const descExists = Boolean(task.desc?.trim());
  const hasTimer = Number(task.timer) > 0;
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority;
  const priorityHint = PRIORITY_HINTS[task.priority] ?? 'Planned focus';
  const resolvedGroupName = groupName || task.groupName || 'No group';
  const progressSummary = task.completed
    ? 'Completed'
    : isTimerRunning
      ? 'Running'
      : isActiveTimer
        ? 'Paused'
        : isOverdue
          ? 'Overdue'
          : task.scheduledDate === today
            ? 'Today'
            : 'Planned';
  const statusDetail = task.completed
    ? formatCompletedLabel(task.completedAt)
    : isOverdue
      ? fullDate
      : task.scheduledDate === today
        ? 'Scheduled today'
        : fullDate;
  const timeSummary = task.completed
    ? 'Timer idle'
    : hasTimer
      ? isActiveTimer
        ? timerLabel
        : `${task.timer}m planned`
      : 'No timer';
  const timeDetail = !task.completed && hasTimer && isActiveTimer ? `Plan ${task.timer}m` : null;
  const canStartTimer = hasTimer && !task.completed;
  const primaryActionLabel = isTimerRunning ? 'Pause' : isActiveTimer ? 'Resume' : 'Start';
  const primaryActionIcon = isTimerRunning ? 'bi-pause-fill' : 'bi-play-fill';

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
            <span className="task-item__group-name">{resolvedGroupName}</span>
          </div>
          <h3 className="task-item__title">{task.title}</h3>
        </div>

        <div className="task-item__summary-strip">
          <div className="task-item__summary-cell">
            <span className="task-item__summary-label">Status</span>
            <strong className="task-item__summary-value">{progressSummary}</strong>
            <span className="task-item__summary-subvalue">{statusDetail}</span>
          </div>

          <div className={`task-item__summary-cell ${isActiveTimer && !task.completed ? 'task-item__summary-cell--active' : ''}`.trim()}>
            <span className="task-item__summary-label">Time</span>
            <strong className={`task-item__summary-value ${hasTimer ? 'task-item__timer-display' : ''}`.trim()}>
              {timeSummary}
            </strong>
            {timeDetail ? <span className="task-item__summary-subvalue">{timeDetail}</span> : null}
          </div>

          <div className="task-item__summary-cell">
            <span className="task-item__summary-label">Priority</span>
            <strong className="task-item__summary-value">{priorityLabel}</strong>
            <span className="task-item__summary-subvalue">{priorityHint}</span>
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
          <div className="task-item__icon-actions">
            <Button
              variant={isTimerRunning ? 'ghost' : 'primary'}
              className={`task-item__icon-button task-item__icon-button--primary ${
                isTimerRunning ? 'task-item__action-button--pause' : ''
              }`.trim()}
              onClick={isTimerRunning ? onPauseTimer : () => onStartTimer(task)}
              disabled={!canStartTimer}
              aria-label={primaryActionLabel === 'Pause' ? 'Metti in pausa timer' : 'Avvia timer'}
              title={primaryActionLabel === 'Pause' ? 'Metti in pausa timer' : 'Avvia timer'}
            >
              <i className={`bi ${primaryActionIcon}`} aria-hidden="true" />
            </Button>

            <Button
              variant="ghost"
              className="task-item__icon-button icon-button"
              onClick={() => onResetTimer(task)}
              disabled={!canStartTimer}
              aria-label="Riavvia timer"
              title="Riavvia timer"
            >
              <i className="bi bi-arrow-repeat" aria-hidden="true" />
            </Button>
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
      </div>
    </article>
  );
}

export default TaskItem;
