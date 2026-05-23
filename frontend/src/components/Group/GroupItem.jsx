// Riga singola del pannello gruppi.
// Mostra nome, stato derivato e numero di task associati.
import Button from '../UI/Button';

const STATUS_LABELS = {
  inactive: 'Inactive',
  in_progress: 'In progress',
  completed: 'Completed',
};

function GroupItem({ group, isSelected, onSelect, onDelete, onEdit, onViewMilestones, taskCount }) {
  const milestones = group.milestones ?? [];
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((milestone) => milestone.completed).length;
  const progress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;
  const statusLabel = STATUS_LABELS[group.status] ?? group.status.replace(/_/g, ' ');
  const milestoneValue = totalMilestones > 0 ? `${completedMilestones}/${totalMilestones}` : '0/0';
  const handleSelect = () => onSelect(group.id);

  return (
    <article className={`group-item ${isSelected ? 'group-item--selected' : ''}`}>
      <button type="button" className="group-item__content" onClick={handleSelect}>
        <div className="group-item__eyebrow">
          <span className="group-item__eyebrow-label">Study</span>
          <span className={`status-pill status-pill--${group.status}`}>{statusLabel}</span>
        </div>
        <span className="group-item__name">{group.name}</span>
        {/* <div className="group-item__stats" aria-label="Group stats">
          <span className="group-item__stat">
            <span className="group-item__stat-label">Open tasks</span>
            <strong>{taskCount}</strong>
          </span>
          <span className="group-item__stat">
            <span className="group-item__stat-label">Milestones</span>
            <strong>{milestoneValue}</strong>
          </span>
        </div> */}
        <div className="group-item__progress-block">
          <div className="group-item__progress" aria-hidden="true">
            <span className="group-item__progress-bar" style={{ width: `${progress}%` }} />
          </div>
          {/* <span className="group-item__progress-value">{progress}%</span> */}
        </div>
      </button>
      <div className="group-item__actions" aria-label={`Actions for ${group.name}`}>
        <Button
          variant="ghost"
          className="group-item__view-milestones icon-button"
          onClick={() => onViewMilestones(group)}
          aria-label="Visualizza milestones"
          title="Visualizza milestones"
        >
          <i className="bi bi-list-check" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          className="group-item__edit icon-button"
          onClick={() => onEdit(group)}
          aria-label="Modifica gruppo"
          title="Modifica gruppo"
        >
          <i className="bi bi-pencil-fill" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          className="group-item__delete icon-button"
          onClick={() => onDelete(group)}
          aria-label="Elimina gruppo"
          title="Elimina gruppo"
        >
          <i className="bi bi-trash3-fill" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

export default GroupItem;
