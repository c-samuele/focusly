import { getTodayDate } from '../../model/Task';
import {
  addMonthsToDateKey,
  formatMonthLabel,
  getMonthStartKey,
} from '../../utils/taskDateRange';
import Button from '../UI/Button';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const parseDateKey = (value) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(`${getTodayDate()}T12:00:00`) : date;
};

const getMonthMatrix = (monthKey) => {
  const monthStartKey = getMonthStartKey(monthKey);
  const monthStartDate = parseDateKey(monthStartKey);
  const monthIndex = monthStartDate.getMonth();
  const firstDay = monthStartDate.getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const gridStart = new Date(monthStartDate);
  gridStart.setDate(gridStart.getDate() - offset);

  return Array.from({ length: 6 }, (_, weekIndex) => (
    Array.from({ length: 7 }, (_, dayIndex) => {
      const nextDate = new Date(gridStart);
      nextDate.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex);
      const key = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

      return {
        key,
        dayNumber: nextDate.getDate(),
        isCurrentMonth: nextDate.getMonth() === monthIndex,
      };
    })
  ));
};

function TaskCalendar({
  monthKey,
  onMonthChange,
  selectedDate,
  onSelectDate,
  today = getTodayDate(),
  className = '',
  ariaLabel = 'Task calendar',
}) {
  const calendarDays = getMonthMatrix(monthKey);

  return (
    <div className={['task-calendar', className].filter(Boolean).join(' ')} role="dialog" aria-label={ariaLabel}>
      <div className="task-calendar__header">
        <Button
          type="button"
          variant="ghost"
          className="task-calendar__nav icon-button"
          onClick={() => onMonthChange((current) => addMonthsToDateKey(current, -1))}
          aria-label="Previous month"
        >
          <i className="bi bi-chevron-left" aria-hidden="true" />
        </Button>

        <strong>{formatMonthLabel(monthKey)}</strong>

        <Button
          type="button"
          variant="ghost"
          className="task-calendar__nav icon-button"
          onClick={() => onMonthChange((current) => addMonthsToDateKey(current, 1))}
          aria-label="Next month"
        >
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </Button>
      </div>

      <div className="task-calendar__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="task-calendar__grid">
        {calendarDays.flat().map((day) => (
          <button
            key={day.key}
            type="button"
            className={[
              'task-calendar__day',
              day.isCurrentMonth ? '' : 'is-muted',
              day.key === selectedDate ? 'is-selected' : '',
              day.key === today ? 'is-today' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onSelectDate(day.key)}
          >
            {day.dayNumber}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TaskCalendar;
