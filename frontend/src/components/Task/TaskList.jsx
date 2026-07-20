// Area centrale dedicata ai task.
// Organizza overview, modal di creazione/modifica e board To Do / Completed.
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTodayDate } from '../../model/Task';
import {
  addDaysToDateKey,
  formatDayLabel,
  getMonthStartKey,
  isSameMonthKey,
} from '../../utils/taskDateRange';
import {
  getGroupAccentStyle,
} from '../../utils/groupAppearance';
import Button from '../UI/Button';
import TaskCalendar from './TaskCalendar';
import TaskForm from './TaskForm';
import TaskSection from './TaskSection';

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
};

const getCompletedDateKey = (task) => task.completedAt?.slice(0, 10) ?? task.scheduledDate ?? '';

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

const sortCompletedTasks = (left, right) => {
  const dateDiff = getCompletedDateKey(right).localeCompare(getCompletedDateKey(left));

  if (dateDiff !== 0) {
    return dateDiff;
  }

  const timeDiff = String(right.completedAt ?? '').localeCompare(String(left.completedAt ?? ''));

  if (timeDiff !== 0) {
    return timeDiff;
  }

  const priorityDiff = PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority];

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return left.title.localeCompare(right.title);
};

const getSummaryMeta = ({ view, pendingTasks, completedTasks, overdueCount, today }) => {
  if (view === 'completed') {
    const completedTodayCount = completedTasks.filter((task) => getCompletedDateKey(task) === today).length;
    const monthStart = getMonthStartKey(today);
    const completedThisMonthCount = completedTasks.filter((task) => {
      const completedDate = getCompletedDateKey(task);
      return completedDate && isSameMonthKey(completedDate, monthStart);
    }).length;

    return [
      { icon: 'bi-check2-circle', value: completedTasks.length, label: 'Done' },
      { icon: 'bi-sun', value: completedTodayCount, label: 'Today' },
      { icon: 'bi-calendar2-month', value: completedThisMonthCount, label: 'Month' },
    ];
  }

  const plannedAheadCount = pendingTasks.filter((task) => task.scheduledDate > today).length;

  return [
    { icon: 'bi-list-task', value: pendingTasks.length, label: 'Open' },
    { icon: 'bi-arrow-up-right-circle', value: plannedAheadCount, label: 'Ahead' },
    { icon: 'bi-exclamation-circle', value: overdueCount, label: 'Overdue' },
  ];
};

const getPeriodMeta = ({ view, anchorDate, quickMode }) => {
  if (quickMode === 'overdue') {
    return {
      caption: 'Attention now',
      label: 'Overdue tasks',
      description: 'Past scheduled tasks still open and waiting for a focused recovery block.',
    };
  }

  return {
    caption: view === 'completed' ? 'Completed on' : 'Scheduled for',
    label: formatDayLabel(anchorDate),
    description: view === 'completed' ? 'Tasks completed on this day.' : 'Open tasks planned for this day.',
  };
};

const getEmptyState = ({ view, quickMode }) => {
  if (quickMode === 'overdue') {
    return {
      icon: 'bi-check2-all',
      title: 'No overdue tasks right now',
      copy: 'Everything open is still inside its planned date window.',
    };
  }

  return {
    icon: view === 'completed' ? 'bi-stars' : 'bi-inbox',
    title: view === 'completed' ? 'No task completed on this day' : 'No task planned for this day',
    copy: view === 'completed'
      ? 'Use arrows or calendar to review progress day by day.'
      : 'Use arrows or calendar to browse nearby dates or add a new task for this slot.',
  };
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
  const [taskView, setTaskView] = useState('todo');
  const [anchorDate, setAnchorDate] = useState(() => getTodayDate());
  const [quickMode, setQuickMode] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthStartKey(getTodayDate()));
  const calendarRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!calendarRef.current?.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const today = getTodayDate();
  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);
  const overduePendingTasks = useMemo(
    () => pendingTasks.filter((task) => task.scheduledDate < today),
    [pendingTasks, today]
  );
  const periodMeta = useMemo(
    () => getPeriodMeta({ view: taskView, anchorDate, quickMode }),
    [anchorDate, quickMode, taskView]
  );
  const emptyState = useMemo(
    () => getEmptyState({ view: taskView, quickMode }),
    [quickMode, taskView]
  );
  const summaryMeta = useMemo(
    () => getSummaryMeta({
      view: taskView,
      pendingTasks,
      completedTasks,
      overdueCount: overduePendingTasks.length,
      today,
    }),
    [completedTasks, overduePendingTasks.length, pendingTasks, taskView, today]
  );
  const visibleTasks = useMemo(() => {
    const sourceTasks = taskView === 'completed' ? completedTasks : pendingTasks;

    if (quickMode === 'overdue') {
      return [...sourceTasks]
        .filter((task) => task.scheduledDate < today)
        .sort(sortTasksForFocus);
    }

    return [...sourceTasks]
      .filter((task) => {
        const targetDate = taskView === 'completed' ? getCompletedDateKey(task) : task.scheduledDate;
        return targetDate === anchorDate;
      })
      .sort(taskView === 'completed' ? sortCompletedTasks : sortTasksForFocus);
  }, [anchorDate, completedTasks, pendingTasks, quickMode, taskView, today]);
  const canShiftForward = useMemo(() => {
    if (quickMode === 'overdue') {
      return false;
    }

    return taskView === 'todo' || anchorDate < today;
  }, [anchorDate, quickMode, taskView, today]);

  useEffect(() => {
    if (editingTask) {
      setShowTaskModal(true);
    }
  }, [editingTask]);

  useEffect(() => {
    if (taskView === 'completed' && quickMode === 'overdue') {
      setQuickMode(null);
    }
  }, [quickMode, taskView]);

  const handleCloseModal = () => {
    setShowTaskModal(false);
    onCancelEdit();
  };

  const handleOpenCreate = () => {
    onCancelEdit();
    setShowTaskModal(true);
  };

  const handleShiftDate = (direction) => {
    if (quickMode === 'overdue') {
      return;
    }

    setAnchorDate((currentDate) => addDaysToDateKey(currentDate, direction));
  };

  const handleJumpToToday = () => {
    setQuickMode(null);
    setAnchorDate(today);
    setCalendarMonth(getMonthStartKey(today));
    setIsCalendarOpen(false);
  };

  const handleToggleOverdue = () => {
    if (taskView === 'completed') {
      return;
    }

    setQuickMode((current) => (current === 'overdue' ? null : 'overdue'));
    setIsCalendarOpen(false);
  };

  const handleToggleCalendar = () => {
    if (quickMode === 'overdue') {
      return;
    }

    setCalendarMonth(getMonthStartKey(anchorDate));
    setIsCalendarOpen((current) => !current);
  };

  const handleSelectCalendarDate = (dateKey) => {
    setQuickMode(null);
    setAnchorDate(dateKey);
    setCalendarMonth(getMonthStartKey(dateKey));
    setIsCalendarOpen(false);
  };

  const handleSubmit = (taskData) => {
    if (editingTask) {
      onUpdateTask(taskData);
    } else {
      onCreateTask(taskData);
    }

    setShowTaskModal(false);
  };

  const accentStyle = hasSelectedGroup ? getGroupAccentStyle(group?.color) : undefined;

  return (
    <section className="panel panel--tasks workspace-screen task-screen" style={accentStyle}>
      <div className="workspace-screen__hero task-screen__hero">
        <div className="task-screen__header">
          <div className="task-screen__header-title-row">
            <h2>{groupName || 'Task'}</h2>
          </div>

          <div className="task-screen__header-controls" aria-label="Task controls">
            <div className="task-screen__header-col task-screen__header-col--view">
              <div className="task-screen__view-switch" role="tablist" aria-label="Task view switch">
                <Button
                  variant={taskView === 'todo' ? 'primary' : 'ghost'}
                  className="analytics__filter-button task-screen__view-button"
                  onClick={() => setTaskView('todo')}
                  aria-selected={taskView === 'todo'}
                >
                  To Do
                </Button>
                <Button
                  variant={taskView === 'completed' ? 'primary' : 'ghost'}
                  className="analytics__filter-button task-screen__view-button"
                  onClick={() => setTaskView('completed')}
                  aria-selected={taskView === 'completed'}
                >
                  Completed
                </Button>
              </div>
            </div>

            <div className="task-screen__header-col task-screen__header-col--period">
              <div className="task-section__quick-actions" aria-label="Task quick filters">
                <Button
                  variant="ghost"
                  className={`task-section__quick-button icon-button ${quickMode === null && anchorDate === today ? 'is-active' : ''}`.trim()}
                  onClick={handleJumpToToday}
                  aria-label="Vai a oggi"
                  title="Vai a oggi"
                >
                  <i className="bi bi-calendar2-day" aria-hidden="true" />
                </Button>
                {taskView === 'todo' ? (
                  <Button
                    variant="ghost"
                    className={`task-section__quick-button icon-button ${quickMode === 'overdue' ? 'is-active' : ''}`.trim()}
                    onClick={handleToggleOverdue}
                    aria-label="Mostra task scaduti"
                    title="Mostra task scaduti"
                  >
                    <i className="bi bi-exclamation-circle" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>

              <div className="analytics__period-nav task-section__period-nav" aria-label="Task period navigation">
                <Button
                  variant="ghost"
                  className="analytics__nav-button icon-button"
                  onClick={() => handleShiftDate(-1)}
                  disabled={quickMode === 'overdue'}
                  aria-label="View previous day"
                  title="View previous day"
                >
                  <i className="bi bi-chevron-left" aria-hidden="true" />
                </Button>

                <div className="analytics__period-label task-section__period-label">
                  <span>{periodMeta.caption}</span>
                  <strong>{periodMeta.label}</strong>
                </div>

                <div className="task-section__calendar-shell" ref={calendarRef}>
                  <Button
                    variant="ghost"
                    className={`analytics__nav-button icon-button ${isCalendarOpen ? 'is-active' : ''}`.trim()}
                    onClick={handleToggleCalendar}
                    disabled={quickMode === 'overdue'}
                    aria-label="Choose a date"
                    title="Choose a date"
                  >
                    <i className="bi bi-calendar3" aria-hidden="true" />
                  </Button>

                  {isCalendarOpen ? (
                    <TaskCalendar
                      monthKey={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      selectedDate={anchorDate}
                      onSelectDate={handleSelectCalendarDate}
                      today={today}
                    />
                  ) : null}
                </div>

                <Button
                  variant="ghost"
                  className="analytics__nav-button icon-button"
                  onClick={() => handleShiftDate(1)}
                  disabled={!canShiftForward}
                  aria-label="View next day"
                  title={canShiftForward ? 'View next day' : 'No later day available'}
                >
                  <i className="bi bi-chevron-right" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="task-screen__header-col task-screen__header-col--action">
              <Button variant="primary" onClick={handleOpenCreate} disabled={!hasSelectedGroup}>
                <i className="bi bi-plus-lg" aria-hidden="true" /> New Task
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showTaskModal ? (
        <>
          <div className="modal fade show d-block task-modal" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable task-modal__dialog">
              <div className="modal-content task-modal__content">
                <div className="modal-header task-modal__header">
                  <div className="task-modal__header-wrapper">
                    <div className="task-modal__header-icon">
                      <i className={`bi ${editingTask ? 'bi-pencil-square' : 'bi-journal-plus'}`} aria-hidden="true" />
                    </div>
                    <div className="task-modal__header-copy">
                      <h3 className="modal-title">{editingTask ? 'Edit task' : 'New task'}</h3>
                    </div>
                  </div>

                  <div className="task-modal__header-stats" aria-label="Task modal metadata">
                    <span className="task-modal__header-pill">
                      <i className="bi bi-collection" aria-hidden="true" />
                      <strong>{groupName || 'Task'}</strong>
                    </span>
                    <span className="task-modal__header-pill">
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
                <div className="task-sections">
                  <TaskSection
                    groupName={groupName}
                    view={taskView}
                    visibleTasks={visibleTasks}
                    summaryMeta={summaryMeta}
                    emptyState={emptyState}
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
