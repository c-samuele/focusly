// Area centrale dedicata ai task.
// Organizza overview, focus panel, modal di creazione/modifica e board To Do / Completed.
import { useEffect, useMemo, useState } from 'react';
import { getTodayDate } from '../../model/Task';
import {
  getGroupAccentStyle,
  GROUP_TYPE_LABELS,
  normalizeGroupType,
} from '../../utils/groupAppearance';
import Button from '../UI/Button';
import TaskCompletedSection from './TaskCompletedSection';
import TaskForm from './TaskForm';
import TaskTodoSection from './TaskTodoSection';

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
};

const GROUP_STATUS_LABELS = {
  inactive: 'Planning',
  in_progress: 'In progress',
  completed: 'Completed',
};

const sortTasksForFocus = (left, right) => {
  const dateDiff = left.scheduledDate.localeCompare(right.scheduledDate);

  if (dateDiff !== 0) {
    return dateDiff;
  }

  const priorityDiff = PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority];

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return left.title.localeCompare(right.title);
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

  const today = getTodayDate();
  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const todayPendingTasks = useMemo(
    () => pendingTasks.filter((task) => task.scheduledDate === today),
    [pendingTasks, today]
  );
  const overduePendingTasks = useMemo(
    () => pendingTasks.filter((task) => task.scheduledDate < today),
    [pendingTasks, today]
  );
  const completedTodayTasks = useMemo(
    () => completedTasks.filter((task) => task.completedAt?.slice(0, 10) === today),
    [completedTasks, today]
  );
  const completionRate = useMemo(
    () => (tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0),
    [completedTasks.length, tasks.length]
  );
  const nextFocusTask = useMemo(
    () => [...pendingTasks].sort(sortTasksForFocus)[0] ?? null,
    [pendingTasks]
  );
  const activeSelectedTask = useMemo(
    () => tasks.find((task) => task.id === activeTaskId) ?? null,
    [activeTaskId, tasks]
  );
  const spotlightTask = activeSelectedTask ?? nextFocusTask;

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

  const groupTypeLabel = hasSelectedGroup
    ? (GROUP_TYPE_LABELS[normalizeGroupType(group?.type)] ?? 'Study')
    : '';
  const groupStatusLabel = hasSelectedGroup
    ? (GROUP_STATUS_LABELS[group?.status] ?? 'Planning')
    : '';
  const accentStyle = hasSelectedGroup ? getGroupAccentStyle(group?.color) : undefined;

  return (
    <section className="panel panel--tasks workspace-screen task-screen" style={accentStyle}>
      <div className="workspace-screen__hero task-screen__hero">
        <div className="workspace-screen__hero-copy task-screen__hero-copy">
          <p className="task-panel__eyebrow">Task Workspace</p>
          <h2>{hasSelectedGroup ? groupName : 'Tasks'}</h2>
        </div>
        <div className="workspace-screen__hero-actions task-screen__hero-actions">
          {hasSelectedGroup ? (
            <div className="task-screen__context">
              <span className="task-screen__context-pill">{groupTypeLabel}</span>
              <span className="task-screen__context-pill">{groupStatusLabel}</span>
              <span className="task-screen__context-pill">{tasks.length} tasks</span>
            </div>
          ) : null}
          <Button variant="primary" onClick={handleOpenCreate} disabled={!hasSelectedGroup}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> New Task
          </Button>
        </div>
      </div>

      {showTaskModal ? (
        <>
          <div className="modal fade show d-block task-modal" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable task-modal__dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="task-modal__header-wrapper">
                    <div className="task-modal__header-icon">
                      <i className={`bi ${editingTask ? 'bi-pencil-square' : 'bi-journal-plus'}`} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="modal-title">{editingTask ? 'Refine study block' : 'Compose study block'}</h3>
                      <p className="task-modal__subtitle">
                        {editingTask
                          ? 'Refine this study block with clearer timing, context and focus cues.'
                          : 'Define the next study block with timing, context and a sharper execution plan.'}
                      </p>
                    </div>
                  </div>

                  <div className="task-modal__header-stats">
                    <span className="task-modal__header-stat">
                      <span>Group</span>
                      <strong>{groupName || 'Task'}</strong>
                    </span>
                    <span className="task-modal__header-stat">
                      <span>Mode</span>
                      <strong>{editingTask ? 'Edit' : 'Create'}</strong>
                    </span>
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

      <div className="workspace-screen__viewport">
        <div className="workspace-screen__scroll">
          <div className="workspace-screen__body task-screen__body">
            {!hasSelectedGroup ? (
              <section className="settings-card task-screen__empty-card">
                <div className="task-screen__empty-icon">
                  <i className="bi bi-folder2-open" aria-hidden="true" />
                </div>
                <div className="task-screen__empty-copy">
                  <span className="settings-card__eyebrow">Ready when you are</span>
                  <h3>Choose a group to open the task workspace</h3>
                  <p>
                    This area turns into a focused task board with one clear next action, a compact summary and a cleaner review flow.
                  </p>
                </div>
              </section>
            ) : (
              <>
                <div className="task-screen__overview">
                  <section className="settings-card task-focus-panel">
                    <div className="task-focus-panel__header">
                      <div>
                        <span className="settings-card__eyebrow">Focus</span>
                        <h3>{activeSelectedTask ? 'Current session' : 'Next best task'}</h3>
                      </div>
                      {spotlightTask ? (
                        <span className={`priority-badge priority-badge--${spotlightTask.priority}`}>
                          {spotlightTask.priority}
                        </span>
                      ) : null}
                    </div>

                    {spotlightTask ? (
                      <>
                        <strong className="task-focus-panel__title">{spotlightTask.title}</strong>
                        <p className="task-focus-panel__description">
                          {activeSelectedTask
                            ? 'The timer is already attached to this task, so you can keep going or quickly review the details.'
                            : 'This is the clearest next block to work on based on schedule and priority.'}
                        </p>

                        <div className="task-focus-panel__meta">
                          <span className="task-focus-panel__meta-chip">
                            <i className="bi bi-calendar2-day" aria-hidden="true" />
                            {spotlightTask.scheduledDate}
                          </span>
                          <span className="task-focus-panel__meta-chip">
                            <i className="bi bi-hourglass-split" aria-hidden="true" />
                            {getTimerLabel(spotlightTask)} / {spotlightTask.timer || 0}m
                          </span>
                          {overduePendingTasks.length > 0 ? (
                            <span className="task-focus-panel__meta-chip task-focus-panel__meta-chip--alert">
                              <i className="bi bi-exclamation-circle" aria-hidden="true" />
                              {overduePendingTasks.length} overdue
                            </span>
                          ) : null}
                        </div>

                        <div className="task-focus-panel__actions">
                          <Button
                            variant={isRunning && activeTaskId === spotlightTask.id ? 'ghost' : 'primary'}
                            onClick={() => (
                              isRunning && activeTaskId === spotlightTask.id
                                ? onPauseTimer?.()
                                : onStartTimer?.(spotlightTask)
                            )}
                            disabled={spotlightTask.timer <= 0}
                          >
                            <i
                              className={`bi ${isRunning && activeTaskId === spotlightTask.id ? 'bi-pause-fill' : 'bi-play-fill'}`}
                              aria-hidden="true"
                            />
                            {isRunning && activeTaskId === spotlightTask.id ? 'Pause focus' : 'Start focus'}
                          </Button>
                          <Button variant="ghost" onClick={() => onEditTask(spotlightTask)}>
                            <i className="bi bi-pencil-square" aria-hidden="true" /> Edit task
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="task-focus-panel__empty">
                        <strong>No task ready yet</strong>
                        <p>Add the first task for this group to surface a clear next action here.</p>
                      </div>
                    )}
                  </section>

                  <section className="settings-card task-summary-panel">
                    <div className="task-summary-panel__header">
                      <div>
                        <span className="settings-card__eyebrow">Overview</span>
                        <h3>Queue health</h3>
                      </div>
                    </div>

                    <div className="task-summary-panel__grid">
                      <article className="task-summary-panel__metric">
                        <span>Open</span>
                        <strong>{pendingTasks.length}</strong>
                        <p>Still in the queue</p>
                      </article>
                      <article className="task-summary-panel__metric">
                        <span>Today</span>
                        <strong>{todayPendingTasks.length}</strong>
                        <p>Need attention now</p>
                      </article>
                      <article className="task-summary-panel__metric">
                        <span>Done today</span>
                        <strong>{completedTodayTasks.length}</strong>
                        <p>Completed blocks</p>
                      </article>
                      <article className="task-summary-panel__metric">
                        <span>Completion</span>
                        <strong>{completionRate}%</strong>
                        <p>Across this group</p>
                      </article>
                    </div>
                  </section>
                </div>

                <div className="task-sections">
                  <TaskTodoSection
                    pendingTasks={pendingTasks}
                    overdueCount={overduePendingTasks.length}
                    activeTaskId={activeTaskId}
                    isRunning={isRunning}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                    onEditTask={onEditTask}
                    onStartTimer={onStartTimer}
                    onPauseTimer={onPauseTimer}
                    onResetTimer={onResetTimer}
                    getTimerLabel={getTimerLabel}
                  />

                  <TaskCompletedSection
                    completedTasks={completedTasks}
                    activeTaskId={activeTaskId}
                    isRunning={isRunning}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                    onEditTask={onEditTask}
                    onStartTimer={onStartTimer}
                    onPauseTimer={onPauseTimer}
                    onResetTimer={onResetTimer}
                    getTimerLabel={getTimerLabel}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TaskList;
