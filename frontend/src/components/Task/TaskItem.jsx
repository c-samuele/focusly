// Card che rappresenta un singolo task nelle colonne del gruppo.
// Usa un unico modello visivo per task da fare e completati.
import Button from '../UI/Button';

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
  const handleToggleComplete = () => {
    onToggleComplete(task.id);
  };

  const hasSupportContent = Boolean(task.desc || task.note || task.completedAt);

  return (
    <article
      className={`task-item ${task.completed ? 'task-item--completed' : ''} ${
        isActiveTimer ? 'task-item--active' : ''
      }`}
    >
      {/* Leading Checkbox */}
      <label className="task-item__check">
        <input
          className="task-item__check-input"
          type="checkbox"
          checked={task.completed}
          onChange={handleToggleComplete}
          aria-label={task.completed ? 'Segna task come da fare' : 'Segna task come completato'}
        />
        <span className={`task-item__check-box ${task.completed ? 'task-item__check-box--checked' : ''}`}>
          <i className="bi bi-check-lg" aria-hidden="true" />
        </span>
      </label>

      {/* Main Content */}
      <div className="task-item__content">
        <div className="task-item__header">
          <h3 className="task-item__title">{task.title}</h3>
          <span className={`priority-badge priority-badge--${task.priority}`}>{task.priority}</span>
        </div>

        <div className="task-item__meta-row">
          <div className="task-item__meta-chip">
            <i className="bi bi-calendar-event" aria-hidden="true" />
            <span>{task.scheduledDate}</span>
          </div>
          {task.timer > 0 && (
            <div className={`task-item__meta-chip ${isActiveTimer ? 'task-item__meta-chip--active' : ''}`}>
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <span className="task-item__timer-display">{timerLabel}</span>
              <span className="task-item__timer-planned">/{task.timer}m</span>
            </div>
          )}
        </div>

        {hasSupportContent ? (
          <div className="task-item__support-row">
            {task.completedAt ? (
              <p className="task-item__support-status">
                <i className="bi bi-check-circle-fill" aria-hidden="true" />
                <span>Completed {task.completedAt.slice(0, 10)}</span>
              </p>
            ) : null}
            {task.desc ? (
              <p className="task-item__support-text">{task.desc}</p>
            ) : null}
            {task.note ? (
              <p className="task-item__support-note">
                <i className="bi bi-pin-angle-fill" aria-hidden="true" />
                <span>{task.note}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="task-item__toolbar">
        {isTimerRunning ? (
          <Button
            variant="ghost"
            className="icon-button"
            onClick={onPauseTimer}
            aria-label="Metti in pausa timer"
            title="Metti in pausa timer"
          >
            <i className="bi bi-pause-fill" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="primary"
            className="icon-button"
            onClick={() => onStartTimer(task)}
            disabled={task.timer <= 0}
            aria-label="Avvia timer"
            title="Avvia timer"
          >
            <i className="bi bi-play-fill" aria-hidden="true" />
          </Button>
        )}
        <Button
          variant="ghost"
          className="icon-button"
          onClick={() => onEdit(task)}
          aria-label="Modifica task"
          title="Modifica task"
        >
          <i className="bi bi-pencil-square" aria-hidden="true" />
        </Button>
        <Button
          variant="danger"
          className="icon-button"
          onClick={() => onDelete(task.id)}
          aria-label="Elimina task"
          title="Elimina task"
        >
          <i className="bi bi-trash3-fill" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

export default TaskItem;
