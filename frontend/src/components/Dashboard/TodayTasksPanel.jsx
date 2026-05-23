// Pannello dei task odierni.
// Mostra solo i task di oggi, con scrolling, border colorato per priorità.
import TaskItem from '../Task/TaskItem';

function TodayTasksPanel({
  todaysTasks,
  activeTaskId,
  isRunning,
  onToggleComplete,
  onDelete,
  onEdit,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  getTimerLabel,
}) {
  return (
    <section className="today-tasks-panel">
      <div className="today-tasks-panel__header">
        <h2>Today's Tasks</h2>
        <span className="today-tasks-panel__count">{todaysTasks.length}</span>
      </div>

      <div className="today-tasks-panel__list">
        {todaysTasks.length > 0 ? (
          todaysTasks.map((task) => (
            <div key={task.id} className={`today-task-item priority-${task.priority}`}>
              <TaskItem
                task={task}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onStartTimer={onStartTimer}
                onPauseTimer={onPauseTimer}
                onResetTimer={onResetTimer}
                timerLabel={getTimerLabel(task)}
                isTimerRunning={isRunning && activeTaskId === task.id}
                isActiveTimer={activeTaskId === task.id}
              />
            </div>
          ))
        ) : (
          <div className="today-tasks-panel__empty">
            <p>No tasks for today. Great work!</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TodayTasksPanel;
