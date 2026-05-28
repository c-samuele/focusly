// Area centrale dedicata ai task.
// Comprende modal di creazione/modifica e colonne To Do / Completed del gruppo selezionato.
import { useEffect, useMemo, useState } from 'react';
import { getTodayDate } from '../../model/Task';
import Button from '../UI/Button';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

const getCurrentWeekStart = () => {
  const today = new Date();
  const start = new Date(today);
  const day = start.getDay();
  const offset = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
};

function TaskList({
  groupName,
  group,
  tasks,
  pendingTasks,
  editingTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  onEditTask,
  onCancelEdit,
  hasSelectedGroup,
  activeTaskId,
  isRunning,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  getTimerLabel,
}) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [todoFilter, setTodoFilter] = useState('today');
  const [completedFilter, setCompletedFilter] = useState('today');

  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const filteredPendingTasks = useMemo(() => {
    const today = getTodayDate();

    if (todoFilter === 'all') {
      return pendingTasks;
    }

    if (todoFilter === 'upcoming') {
      return pendingTasks.filter((task) => task.scheduledDate > today);
    }

    return pendingTasks.filter((task) => task.scheduledDate === today);
  }, [pendingTasks, todoFilter]);
  const filteredCompletedTasks = useMemo(() => {
    if (completedFilter === 'all') {
      return completedTasks;
    }

    if (completedFilter === 'week') {
      const weekStart = getCurrentWeekStart();

      return completedTasks.filter((task) => {
        if (!task.completedAt) {
          return false;
        }

        const completedAt = new Date(task.completedAt);
        return completedAt >= weekStart;
      });
    }

    const today = getTodayDate();
    return completedTasks.filter((task) => task.completedAt?.slice(0, 10) === today);
  }, [completedFilter, completedTasks]);

  useEffect(() => {
    if (editingTask) {
      setShowTaskModal(true);
    }
  }, [editingTask]);

  const handleCloseModal = () => {
    setShowTaskModal(false);
    onCancelEdit();
  };

  const handleOpenCreate = () => {
    onCancelEdit();
    setShowTaskModal(true);
  };

  const handleSubmit = (taskData) => {
    if (editingTask) {
      onUpdateTask(taskData);
    } else {
      onCreateTask(taskData);
    }

    setShowTaskModal(false);
  };

  return (
    <section className="panel panel--tasks">
      <div className="panel__header">
        <div className="task-panel__header">
          <div className="task-panel__header-copy">
            <p className="task-panel__eyebrow">Task Flow</p>
            <h2>{hasSelectedGroup ? groupName : 'Tasks'}</h2>
            <p>
              {hasSelectedGroup
                ? 'Today on the left, done on the right. Keep the group flow tight.'
                : 'Select or create a group to begin.'}
            </p>
          </div>
          <Button variant="primary" onClick={handleOpenCreate} disabled={!hasSelectedGroup}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> New Task
          </Button>
        </div>
      </div>

      {showTaskModal ? (
        <>
          <div className="modal fade show d-block task-modal" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h3 className="modal-title">{editingTask ? 'Edit Task' : 'New Task'}</h3>
                    <p className="task-modal__subtitle">
                      {editingTask ? 'Update the selected task.' : 'Add a new study block to this group.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCloseModal}
                  />
                </div>
                <div className="modal-body">
                  <TaskForm
                    key={editingTask?.id ?? 'create-task'}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    initialValues={editingTask ?? undefined}
                    submitLabel={editingTask ? 'Update Task' : 'Create Task'}
                    disabled={!hasSelectedGroup}
                    group={group}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={handleCloseModal} />
        </>
      ) : null}

      <div className="task-list task-list--separated">
        {!hasSelectedGroup ? (
          <p className="empty-state">Pick a group from the left panel to manage tasks.</p>
        ) : (
          <div className="task-columns task-columns--balanced">
            <div className="task-column">
              <div className="task-column__header">
                <div className="task-column__header-copy">
                  <h3>To Do</h3>
                  <p>Active study blocks waiting for attention.</p>
                </div>
                <div className="task-column__header-actions">
                  <div className="task-filter">
                    <Button
                      variant={todoFilter === 'today' ? 'primary' : 'ghost'}
                      className="task-filter__button"
                      onClick={() => setTodoFilter('today')}
                    >
                      Today
                    </Button>
                    <Button
                      variant={todoFilter === 'upcoming' ? 'primary' : 'ghost'}
                      className="task-filter__button"
                      onClick={() => setTodoFilter('upcoming')}
                    >
                      Upcoming
                    </Button>
                    <Button
                      variant={todoFilter === 'all' ? 'primary' : 'ghost'}
                      className="task-filter__button"
                      onClick={() => setTodoFilter('all')}
                    >
                      All
                    </Button>
                  </div>
                  <span className="task-column__count">{filteredPendingTasks.length}</span>
                </div>
              </div>
              <div className="task-column__body">
                {filteredPendingTasks.length === 0 ? (
                  <p className="empty-state">
                    {todoFilter === 'today'
                      ? 'No tasks scheduled for today in this group.'
                      : todoFilter === 'upcoming'
                        ? 'No upcoming tasks in this group.'
                      : 'No active tasks in this group.'}
                  </p>
                ) : (
                  filteredPendingTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
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
            </div>

            <div className="task-column">
              <div className="task-column__header">
                <div className="task-column__header-copy">
                  <h3>Completed</h3>
                  <p>Finished blocks archived for quick review.</p>
                </div>
                <div className="task-column__header-actions">
                  <div className="task-filter">
                    <Button
                      variant={completedFilter === 'today' ? 'primary' : 'ghost'}
                      className="task-filter__button"
                      onClick={() => setCompletedFilter('today')}
                    >
                      Today
                    </Button>
                    <Button
                      variant={completedFilter === 'week' ? 'primary' : 'ghost'}
                      className="task-filter__button"
                      onClick={() => setCompletedFilter('week')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={completedFilter === 'all' ? 'primary' : 'ghost'}
                      className="task-filter__button"
                      onClick={() => setCompletedFilter('all')}
                    >
                      All
                    </Button>
                  </div>
                  <span className="task-column__count">{filteredCompletedTasks.length}</span>
                </div>
              </div>
              <div className="task-column__body">
                {filteredCompletedTasks.length === 0 ? (
                  <p className="empty-state">
                    {completedFilter === 'today'
                      ? 'No tasks completed today in this group.'
                      : completedFilter === 'week'
                        ? 'No tasks completed this week in this group.'
                      : 'Completed tasks will appear here.'}
                  </p>
                ) : (
                  filteredCompletedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
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
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default TaskList;
