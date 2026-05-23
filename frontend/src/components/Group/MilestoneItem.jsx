// Card che rappresenta una singola milestone nel gruppo.
// Design coerente con TaskItem per consistenza visiva dell'app.
function MilestoneItem({ milestone, index, onToggle }) {
  const handleToggle = () => {
    onToggle(index);
  };

  return (
    <article className={`milestone-item ${milestone.completed ? 'milestone-item--completed' : ''}`}>
      {/* Leading Checkbox */}
      <label className="milestone-item__check">
        <input
          className="milestone-item__check-input"
          type="checkbox"
          checked={milestone.completed}
          onChange={handleToggle}
          aria-label={milestone.completed ? 'Segna milestone come da fare' : 'Segna milestone come completata'}
        />
        <span className={`milestone-item__check-box ${milestone.completed ? 'milestone-item__check-box--checked' : ''}`}>
          <i className="bi bi-check-lg" aria-hidden="true" />
        </span>
      </label>

      {/* Content */}
      <div className="milestone-item__content">
        <p className="milestone-item__text">{milestone.description}</p>
      </div>

    </article>
  );
}

export default MilestoneItem;
