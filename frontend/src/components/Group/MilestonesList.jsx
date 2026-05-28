// Lista di milestones con checkbox, remove button e empty state.
// Prop di controllo: milestones array, onRemove callback, onToggleComplete callback
function MilestonesList({ milestones = [], onRemove, onToggleComplete }) {
  if (milestones.length === 0) {
    return (
      <div className="group-modal__empty-state">
        <i className="bi bi-list-check" aria-hidden="true" />
        <p>No milestones added yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="group-modal__milestones-list">
      {milestones.map((milestone, index) => (
        <div key={`${milestone.id ?? 'milestone'}-${index}`} className="group-modal__milestone-item">
          <input
            type="checkbox"
            id={`milestone-${milestone.id ?? index}`}
            checked={milestone.completed || false}
            onChange={() => onToggleComplete(index)}
            aria-label={`Mark "${milestone.description}" as ${milestone.completed ? 'incomplete' : 'complete'}`}
          />
          <label
            htmlFor={`milestone-${milestone.id ?? index}`}
            className={`group-modal__milestone-text ${milestone.completed ? 'completed' : ''}`}
          >
            {milestone.description}
          </label>
          <button
            type="button"
            className="group-modal__milestone-remove"
            onClick={() => onRemove(index)}
            aria-label={`Remove milestone: ${milestone.description}`}
            title="Remove milestone"
          >
            <i className="bi bi-trash3" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default MilestonesList;
