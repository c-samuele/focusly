// Form usato sia per creare sia per modificare un task.
// Riutilizza la stessa struttura variando i valori iniziali e le callback.
import { useEffect, useState, useRef } from 'react';
import { getTodayDate } from '../../model/Task';
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

function TaskForm({ onSubmit, onCancel, initialValues, submitLabel, disabled, group }) {
  const [formData, setFormData] = useState(defaultValues);
  const [showMilestoneSelector, setShowMilestoneSelector] = useState(false);
  const milestoneButtonRef = useRef(null);

  useEffect(() => {
    // Quando cambia il task in editing riallineiamo il form ai nuovi valori.
    setFormData({
      ...defaultValues,
      ...initialValues,
      timer: initialValues?.timer ?? 0,
      scheduledDate: initialValues?.scheduledDate ?? getTodayDate(),
    });
  }, [initialValues]);

  // Ottieni le milestone incomplete del gruppo
  const incompleteMilestones = group?.milestones?.filter((m) => !m.completed) ?? [];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'timer' ? Number(value) : value,
    }));
  };

  const handleSelectMilestone = (milestone) => {
    setFormData((current) => ({
      ...current,
      title: milestone.description,
    }));
    setShowMilestoneSelector(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const title = formData.title.trim();

    // Il titolo è l'unico campo obbligatorio.
    if (!title || disabled) {
      return;
    }

    onSubmit({
      ...formData,
      title,
      desc: formData.desc.trim(),
      note: formData.note.trim(),
      timer: Number(formData.timer) || 0,
    });

    // Dopo la creazione di un nuovo task resettiamo il form,
    // ma lasciamo la data su "oggi" per velocizzare inserimenti consecutivi.
    if (!initialValues) {
      setFormData({
        ...defaultValues,
        scheduledDate: getTodayDate(),
      });
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form__grid">
        <div className="task-form__title-row">
          <div className="task-form__title-section">
            <span>Title</span>
            <div className="task-form__title-input-wrapper">
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Task title"
              />
              {incompleteMilestones.length > 0 && (
                <button
                  ref={milestoneButtonRef}
                  type="button"
                  className="button button--primary"
                  onClick={() => setShowMilestoneSelector(!showMilestoneSelector)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '11px 14px',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Select from milestone"
                >
                  <i className="bi bi-list-check" aria-hidden="true" /> Milestone
                </button>
              )}

        <MilestoneDropdown
          isOpen={showMilestoneSelector}
          onClose={() => setShowMilestoneSelector(false)}
          milestones={incompleteMilestones}
          onSelectMilestone={handleSelectMilestone}
          triggerElement={milestoneButtonRef.current}
        />
            </div>
          </div>

          <div className="task-form__priority-section">
            <span>Priority</span>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <label className="task-form__full" style={{ gridColumn: '1 / -1' }}>
          <span>Description</span>
          <textarea
            name="desc"
            value={formData.desc}
            onChange={handleChange}
            rows="3"
            placeholder="What do you need to do?"
          />
        </label>

        <label className="task-form__full">
          <span>Note</span>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows="2"
            placeholder="Optional study note"
          />
        </label>

        <label>
          <span>Timer (minutes)</span>
          <input
            type="number"
            min="0"
            name="timer"
            value={formData.timer}
            onChange={handleChange}
          />
        </label>

        <label>
          <span>Study Date</span>
          <input
            type="date"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="task-form__actions">
        <Button type="submit" disabled={disabled}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default TaskForm;
