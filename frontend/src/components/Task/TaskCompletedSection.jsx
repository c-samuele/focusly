import { useMemo, useRef, useState } from 'react';
import { getTodayDate } from '../../model/Task';
import {
  addDaysToDateKey,
  addMonthsToDateKey,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  getMonthStartKey,
  getWeekEndKey,
  getWeekStartKey,
  isDateWithinRange,
  isSameMonthKey,
} from '../../utils/taskDateRange';
import Button from '../UI/Button';
import TaskItem from './TaskItem';

const FILTER_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
];

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
};

const getCompletedDateKey = (task) => task.completedAt?.slice(0, 10) ?? task.scheduledDate ?? '';

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

const getFilterAnchor = (filter) => {
  const today = getTodayDate();

  if (filter === 'week') {
    return getWeekStartKey(today);
  }

  if (filter === 'month') {
    return getMonthStartKey(today);
  }

  return today;
};

const getPeriodMeta = (filter, anchorDate) => {
  if (filter === 'week') {
    return {
      caption: 'Selected week',
      label: formatWeekLabel(anchorDate),
      description: 'Tasks completed during this week.',
    };
  }

  if (filter === 'month') {
    return {
      caption: 'Selected month',
      label: formatMonthLabel(anchorDate),
      description: 'Completed tasks grouped inside this month.',
    };
  }

  if (filter === 'all') {
    return {
      caption: 'Full archive',
      label: 'All completed tasks',
      description: 'A full review stream of every completed block in this group.',
    };
  }

  return {
    caption: 'Selected day',
    label: formatDayLabel(anchorDate),
    description: 'Tasks completed on this day.',
  };
};

const getEmptyState = (filter) => {
  if (filter === 'week') {
    return {
      title: 'No completions in this week',
      copy: 'Shift the week to review older progress or keep checking tasks off to fill this view.',
    };
  }

  if (filter === 'month') {
    return {
      title: 'No completions in this month',
      copy: 'Once tasks are completed, this month view becomes a clean review archive.',
    };
  }

  if (filter === 'all') {
    return {
      title: 'Completed tasks will appear here',
      copy: 'As soon as tasks are checked off, this section becomes the visual archive for the group.',
    };
  }

  return {
    title: 'No task completed on this day',
    copy: 'Use the arrows to inspect nearby dates or complete a task to start building the archive.',
  };
};

function TaskCompletedSection({
  completedTasks,
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
      return [...completedTasks].sort(sortCompletedTasks);
    }

    if (filter === 'week') {
      const weekStart = getWeekStartKey(anchorDate);
      const weekEnd = getWeekEndKey(anchorDate);

      return completedTasks
        .filter((task) => {
          const completedDate = getCompletedDateKey(task);
          return completedDate && isDateWithinRange(completedDate, weekStart, weekEnd);
        })
        .sort(sortCompletedTasks);
    }

    if (filter === 'month') {
      const monthStart = getMonthStartKey(anchorDate);

      return completedTasks
        .filter((task) => {
          const completedDate = getCompletedDateKey(task);
          return completedDate && isSameMonthKey(completedDate, monthStart);
        })
        .sort(sortCompletedTasks);
    }

    return completedTasks
      .filter((task) => getCompletedDateKey(task) === anchorDate)
      .sort(sortCompletedTasks);
  }, [anchorDate, completedTasks, filter]);

  const periodMeta = getPeriodMeta(filter, anchorDate);
  const emptyState = getEmptyState(filter);
  const today = getTodayDate();
  const completedTodayCount = useMemo(
    () => completedTasks.filter((task) => getCompletedDateKey(task) === today).length,
    [completedTasks, today]
  );
  const completedThisMonthCount = useMemo(() => {
    const monthStart = getMonthStartKey(today);
    return completedTasks.filter((task) => {
      const completedDate = getCompletedDateKey(task);
      return completedDate && isSameMonthKey(completedDate, monthStart);
    }).length;
  }, [completedTasks, today]);

  const canShiftForward = useMemo(() => {
    if (filter === 'all') {
      return false;
    }

    if (filter === 'week') {
      return anchorDate < getWeekStartKey(today);
    }

    if (filter === 'month') {
      return anchorDate < getMonthStartKey(today);
    }

    return anchorDate < today;
  }, [anchorDate, filter, today]);

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

      if (filter === 'month') {
        return addMonthsToDateKey(currentDate, direction);
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
    <section className="settings-card task-section task-section--completed">
      <div className="task-section__header">
        <div className="task-section__copy">
          <span className="settings-card__eyebrow">Completed</span>
          <h3>Completed</h3>
        </div>

        <div className="task-section__summary" aria-label="Completed summary">
          <span
            className="task-section__summary-pill"
            title="Completed tasks"
            aria-label={`Completed tasks: ${completedTasks.length}`}
          >
            <i className="bi bi-check2-circle" aria-hidden="true" />
            <strong>{completedTasks.length}</strong>
            <span className="visually-hidden">Done</span>
          </span>
          <span
            className="task-section__summary-pill"
            title="Completed today"
            aria-label={`Completed today: ${completedTodayCount}`}
          >
            <i className="bi bi-sun" aria-hidden="true" />
            <strong>{completedTodayCount}</strong>
            <span className="visually-hidden">Today</span>
          </span>
          <span
            className="task-section__summary-pill"
            title="Completed this month"
            aria-label={`Completed this month: ${completedThisMonthCount}`}
          >
            <i className="bi bi-calendar2-month" aria-hidden="true" />
            <strong>{completedThisMonthCount}</strong>
            <span className="visually-hidden">Month</span>
          </span>
        </div>
      </div>

      <div className="task-section__toolbar">
        <div className="task-filter" role="group" aria-label="Completed task filters">
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

        <div className="analytics__period-nav task-section__period-nav" aria-label="Completed period navigation">
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
            disabled={!canShiftForward}
            aria-label="View next period"
            title={canShiftForward ? 'View next period' : 'Already on the latest available period'}
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <p className="task-section__meta">{periodMeta.description}</p>

      <div className="task-section__body">
        {visibleTasks.length === 0 ? (
          <div className="task-section__empty">
            <i className="bi bi-stars" aria-hidden="true" />
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

export default TaskCompletedSection;
