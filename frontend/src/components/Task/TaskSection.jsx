import TaskItem from './TaskItem';

function TaskSection({
  groupName,
  view,
  visibleTasks,
  summaryMeta,
  emptyState,
  activeTaskId,
  isRunning,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  getTimerLabel,
}) {
  return (
    <section className={`settings-card task-section task-section--unified task-section--${view}`.trim()}>
      <div className="task-section__summary task-section__summary--band" aria-label="Task summary">
        {summaryMeta.map((item) => (
          <span
            key={item.label}
            className="task-section__summary-pill"
            aria-label={`${item.label}: ${item.value}`}
            title={item.label}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </span>
        ))}
      </div>

      <div className="task-section__body">
        {visibleTasks.length === 0 ? (
          <div className="task-section__empty">
            <i className={`bi ${emptyState.icon}`} aria-hidden="true" />
            <strong>{emptyState.title}</strong>
            <p>{emptyState.copy}</p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              groupName={groupName}
              onToggleComplete={onToggleComplete}
              onDelete={onDeleteTask}
              onEdit={onEditTask}
              onStartTimer={onStartTimer}
              onPauseTimer={onPauseTimer}
              onResetTimer={onResetTimer}
              timerLabel={getTimerLabel(task)}
              isTimerRunning={activeTaskId === task.id && isRunning}
              isActiveTimer={activeTaskId === task.id}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default TaskSection;
