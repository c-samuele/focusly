import { useMemo, useRef, useState } from 'react';
import { getTodayDate } from '../../model/Task';
import {
  addDaysToDateKey,
  formatDayLabel,
  formatWeekLabel,
  getWeekEndKey,
  getWeekStartKey,
  isDateWithinRange,
} from '../../utils/taskDateRange';
import Button from '../UI/Button';
import TaskItem from './TaskItem';

const FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'Week' },
  { value: 'all', label: 'All' },
];

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
};

const sortTodoTasks = (left, right) => {
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

const getFilterAnchor = (filter) => {
  const today = getTodayDate();

  if (filter === 'tomorrow') {
    return addDaysToDateKey(today, 1);
  }

  if (filter === 'week') {
    return getWeekStartKey(today);
  }

  return today;
};

const getPeriodMeta = (filter, anchorDate) => {
  if (filter === 'week') {
    return {
      caption: 'Selected week',
      label: formatWeekLabel(anchorDate),
      description: 'Open tasks scheduled inside this week.',
    };
  }

  if (filter === 'all') {
    return {
      caption: 'Entire queue',
      label: 'All scheduled tasks',
      description: 'Every open task in this group, without date limits.',
    };
  }

  return {
    caption: filter === 'tomorrow' ? 'Next day view' : 'Selected day',
    label: formatDayLabel(anchorDate),
    description: 'Open tasks scheduled for this day.',
  };
};

const getEmptyState = (filter) => {
  if (filter === 'week') {
    return {
      title: 'Nothing scheduled in this week',
      copy: 'Shift the week or add new blocks to build a clearer execution window.',
    };
  }

  if (filter === 'all') {
    return {
      title: 'No open tasks in this group',
      copy: 'Create the first study block to shape the queue for this group.',
    };
  }

  return {
    title: 'No task planned for this day',
    copy: 'Use the arrows to browse nearby dates or add a new task for this slot.',
  };
};

function TaskTodoSection({
  pendingTasks,
  overdueCount,
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
  const [filter, setFilter] = useState('today');
  const [anchorDate, setAnchorDate] = useState(() => getTodayDate());
  const dateInputRef = useRef(null);

  const visibleTasks = useMemo(() => {
    if (filter === 'all') {
      return [...pendingTasks].sort(sortTodoTasks);
    }

    if (filter === 'week') {
      const weekStart = getWeekStartKey(anchorDate);
      const weekEnd = getWeekEndKey(anchorDate);

      return pendingTasks
        .filter((task) => isDateWithinRange(task.scheduledDate, weekStart, weekEnd))
        .sort(sortTodoTasks);
    }

    return pendingTasks
      .filter((task) => task.scheduledDate === anchorDate)
      .sort(sortTodoTasks);
  }, [anchorDate, filter, pendingTasks]);

  const periodMeta = getPeriodMeta(filter, anchorDate);
  const emptyState = getEmptyState(filter);
  const plannedAheadCount = useMemo(
    () => pendingTasks.filter((task) => task.scheduledDate > getTodayDate()).length,
    [pendingTasks]
  );

  const handleFilterChange = (nextFilter) => {
    setFilter(nextFilter);
    setAnchorDate(getFilterAnchor(nextFilter));
  };

  const handleShift = (direction) => {
    if (filter === 'all') {
      return;
    }

    setAnchorDate((currentDate) => {
      if (filter === 'week') {
        return addDaysToDateKey(currentDate, direction * 7);
      }

      return addDaysToDateKey(currentDate, direction);
    });
  };

  const handleOpenDatePicker = () => {
    if (filter === 'all') {
      return;
    }

    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker();
      return;
    }

    dateInputRef.current?.click();
  };

  return (
    <section className="settings-card task-section task-section--todo">
      <div className="task-section__header">
        <div className="task-section__copy">
          <span className="settings-card__eyebrow">To Do</span>
          <h3>To Do</h3>
        </div>

        <div className="task-section__summary" aria-label="To do summary">
          <span
            className="task-section__summary-pill"
            title="Open tasks"
            aria-label={`Open tasks: ${pendingTasks.length}`}
          >
            <i className="bi bi-list-task" aria-hidden="true" />
            <strong>{pendingTasks.length}</strong>
            <span className="visually-hidden">Open</span>
          </span>
          <span
            className="task-section__summary-pill"
            title="Planned ahead"
            aria-label={`Planned ahead: ${plannedAheadCount}`}
          >
            <i className="bi bi-arrow-up-right-circle" aria-hidden="true" />
            <strong>{plannedAheadCount}</strong>
            <span className="visually-hidden">Ahead</span>
          </span>
          <span
            className="task-section__summary-pill"
            title="Overdue tasks"
            aria-label={`Overdue tasks: ${overdueCount}`}
          >
            <i className="bi bi-exclamation-circle" aria-hidden="true" />
            <strong>{overdueCount}</strong>
            <span className="visually-hidden">Overdue</span>
          </span>
        </div>
      </div>

      <div className="task-section__toolbar">
        <div className="task-filter" role="group" aria-label="Open task filters">
          {FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'primary' : 'ghost'}
              className="task-filter__button analytics__filter-button"
              onClick={() => handleFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="analytics__period-nav task-section__period-nav" aria-label="To do period navigation">
          <input
            ref={dateInputRef}
            className="visually-hidden"
            type="date"
            value={anchorDate}
            onChange={(event) => setAnchorDate(event.target.value || getTodayDate())}
            tabIndex={-1}
            aria-hidden="true"
          />

          <Button
            variant="ghost"
            className="analytics__nav-button icon-button"
            onClick={() => handleShift(-1)}
            disabled={filter === 'all'}
            aria-label="View previous period"
            title={filter === 'all' ? 'No date navigation in all view' : 'View previous period'}
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </Button>

          <div className="analytics__period-label task-section__period-label">
            <span>{periodMeta.caption}</span>
            <strong>{periodMeta.label}</strong>
          </div>

          <Button
            variant="ghost"
            className="analytics__nav-button icon-button"
            onClick={handleOpenDatePicker}
            disabled={filter === 'all'}
            aria-label="Choose a date"
            title={filter === 'all' ? 'No date navigation in all view' : 'Choose a date'}
          >
            <i className="bi bi-calendar3" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            className="analytics__nav-button icon-button"
            onClick={() => handleShift(1)}
            disabled={filter === 'all'}
            aria-label="View next period"
            title={filter === 'all' ? 'No date navigation in all view' : 'View next period'}
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <p className="task-section__meta">{periodMeta.description}</p>

      <div className="task-section__body">
        {visibleTasks.length === 0 ? (
          <div className="task-section__empty">
            <i className="bi bi-inbox" aria-hidden="true" />
            <strong>{emptyState.title}</strong>
            <p>{emptyState.copy}</p>
          </div>
        ) : (
          visibleTasks.map((task) => (
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
    </section>
  );
}

export default TaskTodoSection;
