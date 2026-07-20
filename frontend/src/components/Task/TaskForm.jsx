// Form usato sia per creare sia per modificare un task.
// Lo presenta come composer di uno study block, con sezioni Core / Schedule / Details.
import { useEffect, useRef, useState } from 'react';
import { getTodayDate, TASK_TITLE_MAX_LENGTH } from '../../model/Task';
import { formatDayLabel, getMonthStartKey } from '../../utils/taskDateRange';
import Button from '../UI/Button';
import MilestoneDropdown from './MilestoneDropdown';
import TaskCalendarPopover from './TaskCalendarPopover';

const defaultValues = {
  title: '',
  desc: '',
  note: '',
  timer: 0,
  priority: 'medium',
  scheduledDate: getTodayDate(),
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: 'bi-arrow-down-right', hint: 'Flexible' },
  { value: 'medium', label: 'Medium', icon: 'bi-equal', hint: 'Balanced' },
  { value: 'high', label: 'High', icon: 'bi-arrow-up-right', hint: 'Urgent' },
];

const TIMER_STEP_MINUTES = 5;

const formatTimerPart = (value) => String(Math.max(0, Number(value) || 0)).padStart(2, '0');

const getTimerParts = (minutesValue) => {
  const totalMinutes = Math.max(0, Number(minutesValue) || 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours: formatTimerPart(hours),
    minutes: formatTimerPart(minutes),
  };
};

const parseTimerPart = (value, max) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 2);
  const parsed = Number.parseInt(digits, 10);

  if (!digits) {
    return '';
  }

  return String(Math.min(max, Number.isNaN(parsed) ? 0 : parsed));
};

function TaskForm({ onSubmit, onCancel, initialValues, submitLabel, disabled, group }) {
  const [formData, setFormData] = useState(defaultValues);
  const [showMilestoneSelector, setShowMilestoneSelector] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthStartKey(getTodayDate()));
  const [timerHours, setTimerHours] = useState(() => getTimerParts(defaultValues.timer).hours);
  const [timerMinutes, setTimerMinutes] = useState(() => getTimerParts(defaultValues.timer).minutes);
  const milestoneButtonRef = useRef(null);
  const titleInputRef = useRef(null);
  const calendarButtonRef = useRef(null);

  useEffect(() => {
    const nextScheduledDate = initialValues?.scheduledDate ?? getTodayDate();

    setFormData({
      ...defaultValues,
      ...initialValues,
      timer: initialValues?.timer ?? 0,
      scheduledDate: nextScheduledDate,
    });
    setCalendarMonth(getMonthStartKey(nextScheduledDate));
    setIsCalendarOpen(false);
    const nextTimerParts = getTimerParts(initialValues?.timer ?? 0);
    setTimerHours(nextTimerParts.hours);
    setTimerMinutes(nextTimerParts.minutes);
  }, [initialValues]);

  useEffect(() => {
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);
  }, [initialValues]);

  const incompleteMilestones = group?.milestones?.filter((milestone) => !milestone.completed) ?? [];
  const isEditing = Boolean(initialValues?.id);
  const trimmedTitle = formData.title.trim();
  const scheduledDate = formData.scheduledDate || getTodayDate();
  const scheduledDateLabel = formatDayLabel(scheduledDate);
  const isSubmitDisabled = disabled || !trimmedTitle;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'timer' ? Number(value) : value,
    }));
  };

  const handlePriorityChange = (priority) => {
    setFormData((current) => ({
      ...current,
      priority,
    }));
  };

  const handleSelectMilestone = (milestone) => {
    setFormData((current) => ({
      ...current,
      title: String(milestone.description ?? '').slice(0, TASK_TITLE_MAX_LENGTH),
    }));
    setShowMilestoneSelector(false);
  };

  const handleToggleCalendar = () => {
    setCalendarMonth(getMonthStartKey(scheduledDate));
    setIsCalendarOpen((current) => !current);
  };

  const handleSelectCalendarDate = (dateKey) => {
    setFormData((current) => ({
      ...current,
      scheduledDate: dateKey,
    }));
    setCalendarMonth(getMonthStartKey(dateKey));
    setIsCalendarOpen(false);
  };

  const handleAdjustTimer = (delta) => {
    setFormData((current) => {
      const nextTimer = Math.max(0, (Number(current.timer) || 0) + delta);
      const nextTimerParts = getTimerParts(nextTimer);
      setTimerHours(nextTimerParts.hours);
      setTimerMinutes(nextTimerParts.minutes);

      return {
        ...current,
        timer: nextTimer,
      };
    });
  };

  const syncTimerParts = (nextHours, nextMinutes) => {
    const hoursValue = Math.max(0, Number.parseInt(nextHours || '0', 10) || 0);
    const minutesValue = Math.max(0, Number.parseInt(nextMinutes || '0', 10) || 0);
    const normalizedHours = hoursValue + Math.floor(minutesValue / 60);
    const normalizedMinutes = minutesValue % 60;
    const nextTimer = normalizedHours * 60 + normalizedMinutes;

    setFormData((current) => ({
      ...current,
      timer: nextTimer,
    }));
    setTimerHours(formatTimerPart(normalizedHours));
    setTimerMinutes(formatTimerPart(normalizedMinutes));
  };

  const handleTimerHoursChange = (event) => {
    const nextHours = parseTimerPart(event.target.value, 99);
    setTimerHours(nextHours);
    syncTimerParts(nextHours, timerMinutes);
  };

  const handleTimerMinutesChange = (event) => {
    const nextMinutes = parseTimerPart(event.target.value, 59);
    setTimerMinutes(nextMinutes);
    syncTimerParts(timerHours, nextMinutes);
  };

  const handleTimerFieldBlur = () => {
    syncTimerParts(timerHours, timerMinutes);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const title = formData.title.trim();

    if (!title || disabled) {
      return;
    }

    onSubmit({
      ...formData,
      title: title.slice(0, TASK_TITLE_MAX_LENGTH),
      desc: formData.desc.trim(),
      note: formData.note.trim(),
      timer: Number(formData.timer) || 0,
    });

    if (!initialValues) {
      setFormData((current) => ({
        ...defaultValues,
        scheduledDate: current.scheduledDate || getTodayDate(),
        priority: current.priority,
      }));
    }
  };

  return (
    <form className="task-form task-composer" onSubmit={handleSubmit}>
      <div className="task-composer__body">
        <div className="task-composer__shell">
          <div className="task-composer__top-row">
            <div className="task-composer__identity">
              <label className="task-composer__title-field" htmlFor="task-title">
                <i className="bi bi-pencil-square" aria-hidden="true" />
                <input
                  id="task-title"
                  ref={titleInputRef}
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Task title"
                  maxLength={TASK_TITLE_MAX_LENGTH}
                  aria-label="Task title"
                />
              </label>

              <div className="task-composer__identity-actions">
                <span className="task-composer__counter">{formData.title.length}/{TASK_TITLE_MAX_LENGTH}</span>
                {incompleteMilestones.length > 0 ? (
                  <button
                    ref={milestoneButtonRef}
                    type="button"
                    className="task-composer__milestone-button"
                    onClick={() => setShowMilestoneSelector((current) => !current)}
                    aria-label="Use milestone"
                  >
                    <i className="bi bi-list-check" aria-hidden="true" />
                  </button>
                ) : null}
                <MilestoneDropdown
                  isOpen={showMilestoneSelector}
                  onClose={() => setShowMilestoneSelector(false)}
                  milestones={incompleteMilestones}
                  onSelectMilestone={handleSelectMilestone}
                  triggerElement={milestoneButtonRef.current}
                />
              </div>
            </div>

            <div className="task-composer__priority-strip" role="group" aria-label="Task priority">
              <div className="task-composer__priority-group">
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`task-composer__priority-pill ${formData.priority === option.value ? 'is-active' : ''}`}
                    onClick={() => handlePriorityChange(option.value)}
                    aria-label={`${option.label} priority`}
                  >
                    <i className={`bi ${option.icon}`} aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="task-composer__planner">
            <div className="task-composer__date-block">
              <div className="task-composer__date-inline">
                <div className="task-composer__date-copy">
                  <strong>{scheduledDateLabel}</strong>
                  <span>{scheduledDate}</span>
                </div>
                <button
                  ref={calendarButtonRef}
                  type="button"
                  className={`task-composer__date-button icon-button ${isCalendarOpen ? 'is-open' : ''}`.trim()}
                  onClick={handleToggleCalendar}
                  aria-expanded={isCalendarOpen}
                  aria-label="Choose task date"
                >
                  <i className="bi bi-calendar3" aria-hidden="true" />
                </button>
              </div>

              <TaskCalendarPopover
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                triggerElement={calendarButtonRef.current}
                monthKey={calendarMonth}
                onMonthChange={setCalendarMonth}
                selectedDate={scheduledDate}
                onSelectDate={handleSelectCalendarDate}
                ariaLabel="Task schedule calendar"
              />
            </div>

            <div className="task-composer__timer-block" aria-label="Task timer">
              <div className="task-composer__timer-control">
                <i className="bi bi-stopwatch" aria-hidden="true" />
                <button
                  type="button"
                  className="task-composer__timer-adjust"
                  onClick={() => handleAdjustTimer(-TIMER_STEP_MINUTES)}
                  aria-label={`Remove ${TIMER_STEP_MINUTES} minutes`}
                >
                  -
                </button>
                <div className="task-composer__timer-fields" aria-label="Task timer">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="task-composer__timer-input"
                    value={timerHours}
                    onChange={handleTimerHoursChange}
                    onBlur={handleTimerFieldBlur}
                    aria-label="Timer hours"
                  />
                  <span className="task-composer__timer-separator">:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="task-composer__timer-input"
                    value={timerMinutes}
                    onChange={handleTimerMinutesChange}
                    onBlur={handleTimerFieldBlur}
                    aria-label="Timer minutes"
                  />
                </div>
                <button
                  type="button"
                  className="task-composer__timer-adjust"
                  onClick={() => handleAdjustTimer(TIMER_STEP_MINUTES)}
                  aria-label={`Add ${TIMER_STEP_MINUTES} minutes`}
                >
                  +
                </button>
              </div>
            </div>

          </div>

          <div className="task-composer__details-grid">
            <label className="task-composer__text-panel" htmlFor="task-desc">
              <div className="task-composer__text-panel-icon" aria-hidden="true">
                <i className="bi bi-journal-text" />
              </div>
              <textarea
                id="task-desc"
                name="desc"
                value={formData.desc}
                onChange={handleChange}
                rows="5"
                placeholder="Description"
                aria-label="Task description"
              />
            </label>

            <label className="task-composer__text-panel" htmlFor="task-note">
              <div className="task-composer__text-panel-icon" aria-hidden="true">
                <i className="bi bi-pin-angle" />
              </div>
              <textarea
                id="task-note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows="5"
                placeholder="Note"
                aria-label="Task note"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="task-composer__footer">
        <div className="task-composer__footer-actions">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default TaskForm;
