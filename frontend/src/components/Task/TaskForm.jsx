// Form usato sia per creare sia per modificare un task.
// Lo presenta come composer di uno study block, con sezioni Core / Schedule / Details.
import { useEffect, useRef, useState } from 'react';
import { getTodayDate, TASK_TITLE_MAX_LENGTH } from '../../model/Task';
import Button from '../UI/Button';
import MilestoneDropdown from './MilestoneDropdown';

const defaultValues = {
  title: '',
  desc: '',
  note: '',
  timer: 0,
  priority: 'medium',
  scheduledDate: getTodayDate(),
};

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: 'bi-arrow-down-right' },
  { value: 'medium', label: 'Medium', icon: 'bi-equal' },
  { value: 'high', label: 'High', icon: 'bi-arrow-up-right' },
];

function TaskForm({ onSubmit, onCancel, initialValues, submitLabel, disabled, group }) {
  const [formData, setFormData] = useState(defaultValues);
  const [showMilestoneSelector, setShowMilestoneSelector] = useState(false);
  const milestoneButtonRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    setFormData({
      ...defaultValues,
      ...initialValues,
      timer: initialValues?.timer ?? 0,
      scheduledDate: initialValues?.scheduledDate ?? getTodayDate(),
    });
  }, [initialValues]);

  useEffect(() => {
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);
  }, [initialValues]);

  const incompleteMilestones = group?.milestones?.filter((milestone) => !milestone.completed) ?? [];
  const isEditing = Boolean(initialValues?.id);
  const isCompletedTask = Boolean(initialValues?.completed);
  const trimmedTitle = formData.title.trim();
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
        <section className="task-composer__hero">
          <div className="task-composer__hero-copy">
            <span className="task-composer__eyebrow">Study Block</span>
            <h4>{isEditing ? 'Refine the task before the next session' : 'Shape the next focus block'}</h4>
            <p>
              {isEditing
                ? 'Update timing, context and notes without losing the rhythm of the workspace.'
                : 'Give this task a clear outcome, a planned slot and enough context to start with confidence.'}
            </p>
          </div>

          <div className="task-composer__hero-stats">
            <div className="task-composer__hero-stat">
              <span>Group</span>
              <strong>{group?.name || 'No group'}</strong>
            </div>
            <div className="task-composer__hero-stat">
              <span>When</span>
              <strong>{formData.scheduledDate || getTodayDate()}</strong>
            </div>
            <div className="task-composer__hero-stat">
              <span>Status</span>
              <strong>{isCompletedTask ? 'Completed' : isEditing ? 'Editing' : 'Draft'}</strong>
            </div>
          </div>
        </section>

        <section className="task-composer__section task-composer__section--core">
          <div className="task-composer__section-heading">
            <span className="task-composer__eyebrow">Core</span>
            <h5>Task identity</h5>
            <p>Start with a sharp title and optionally pull it from one of the remaining milestones.</p>
          </div>

          <div className="task-composer__field task-composer__field--title">
            <div className="task-composer__label-row">
              <label htmlFor="task-title">Title</label>
              <small>{formData.title.length}/{TASK_TITLE_MAX_LENGTH}</small>
            </div>

            <div className="task-composer__title-input-row">
              <input
                id="task-title"
                ref={titleInputRef}
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Finish chapter summary and create flashcards"
                maxLength={TASK_TITLE_MAX_LENGTH}
              />

              {incompleteMilestones.length > 0 ? (
                <button
                  ref={milestoneButtonRef}
                  type="button"
                  className="task-composer__milestone-button"
                  onClick={() => setShowMilestoneSelector((current) => !current)}
                  title="Select from milestone"
                >
                  <i className="bi bi-list-check" aria-hidden="true" />
                  <span>Use milestone</span>
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
        </section>

        <section className="task-composer__section task-composer__section--schedule">
          <div className="task-composer__section-heading">
            <span className="task-composer__eyebrow">Schedule</span>
            <h5>Timing and intensity</h5>
            <p>Decide when to do it, how long it deserves and how much urgency it carries.</p>
          </div>

          <div className="task-composer__schedule-grid">
            <label className="task-composer__field">
              <span>Date</span>
              <input
                type="date"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
              />
            </label>

            <label className="task-composer__field">
              <span>Timer</span>
              <div className="task-composer__timer-input">
                <input
                  type="number"
                  min="0"
                  name="timer"
                  value={formData.timer}
                  onChange={handleChange}
                />
                <small>minutes</small>
              </div>
            </label>

            <div className="task-composer__field task-composer__field--priority">
              <span>Priority</span>
              <div className="task-composer__priority-group" role="group" aria-label="Task priority">
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`task-composer__priority-pill ${formData.priority === option.value ? 'is-active' : ''}`}
                    onClick={() => handlePriorityChange(option.value)}
                  >
                    <i className={`bi ${option.icon}`} aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="task-composer__section task-composer__section--details">
          <div className="task-composer__section-heading">
            <span className="task-composer__eyebrow">Details</span>
            <h5>Execution context</h5>
            <p>Add the short brief and the note you want visible when the task returns to your attention.</p>
          </div>

          <div className="task-composer__details-grid">
            <label className="task-composer__field">
              <span>Description</span>
              <textarea
                name="desc"
                value={formData.desc}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the concrete outcome of this study block."
              />
            </label>

            <label className="task-composer__field">
              <span>Note</span>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows="4"
                placeholder="Add a reminder, cue or study constraint you want visible later."
              />
            </label>
          </div>
        </section>
      </div>

      <div className="task-composer__footer">
        <div className="task-composer__footer-copy">
          <strong>{trimmedTitle ? 'Ready to save' : 'Title required'}</strong>
          <span>
            {trimmedTitle
              ? 'The task now has enough structure to re-enter the workspace clearly.'
              : 'Start from the title to enable the composer action.'}
          </span>
        </div>

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
