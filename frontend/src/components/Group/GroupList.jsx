// Colonna laterale dei gruppi di studio.
// Qui si crea, seleziona ed elimina un gruppo.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../UI/Button';
import GroupItem from './GroupItem';

function GroupList({
  groups,
  selectedGroupId,
  onOpenCreateGroup,
  onOpenEditGroup,
  onOpenViewMilestones,
  onDeleteGroup,
  onSelectGroup,
  taskCounts,
}) {
  const [groupToDelete, setGroupToDelete] = useState(null);

  const handleCreate = () => {
    onOpenCreateGroup();
  };

  const handleRequestDelete = (group) => {
    setGroupToDelete(group);
  };

  const handleCancelDelete = () => {
    setGroupToDelete(null);
  };
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  const handleConfirmDelete = () => {
    if (!groupToDelete) {
      return;
    }

    onDeleteGroup(groupToDelete.id);
    setGroupToDelete(null);
  };

  return (
    <aside className="panel panel--groups">
      <div className="panel__header panel__header--groups">
        <div className="panel__headline">
          <h2>{groups.length} {groups.length === 1 ? 'group' : 'groups'}</h2>
        </div>
        <div className="group-header-actions">
          <Button
            type="button"
            variant="primary"
            className="group-create-button icon-button"
            onClick={handleCreate}
            aria-label="Create group"
            title="Create group"
          >
            <i className="bi bi-plus-lg" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="group-list">
        {groups.length === 0 ? (
          <p className="empty-state">Create your first group to start planning.</p>
        ) : (
          groups.map((group) => (
            <GroupItem
              key={group.id}
              group={group}
              isSelected={group.id === selectedGroupId}
              onSelect={onSelectGroup}
              onDelete={handleRequestDelete}
              onEdit={onOpenEditGroup}
              onViewMilestones={onOpenViewMilestones}
              taskCount={taskCounts[group.id] ?? 0}
            />
          ))
        )}
      </div>

      {/* Delete Group Modal */}
      {groupToDelete && modalRoot ? createPortal((
        <>
          <div className="modal fade show d-block group-modal" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h3 className="modal-title">Delete Group</h3>
                    <p className="modal-title__subtitle" style={{ margin: '6px 0 0', color: 'var(--muted-color)' }}>
                      This will also remove all tasks inside <strong>{groupToDelete.name}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCancelDelete}
                  />
                </div>
                <div className="modal-body group-modal__body">
                  <p>Do you want to continue?</p>
                  <div className="group-modal__actions">
                    <Button type="button" variant="ghost" onClick={handleCancelDelete}>
                      Cancel
                    </Button>
                    <Button type="button" variant="danger" onClick={handleConfirmDelete}>
                      Delete Group
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show group-modal__backdrop" onClick={handleCancelDelete} />
        </>
      ), modalRoot) : null}
    </aside>
  );
}

export default GroupList;
