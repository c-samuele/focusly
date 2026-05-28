// Colonna laterale dei gruppi di studio.
// Qui si crea, seleziona ed elimina un gruppo.
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../UI/Button';
import CreateGroupModal from './CreateGroupModal';
import GroupItem from './GroupItem';
import MilestoneItem from './MilestoneItem';

function GroupList({
  groups,
  selectedGroupId,
  onCreateGroup,
  onDeleteGroup,
  onSelectGroup,
  onUpdateGroup,
  onViewMilestones,
  taskCounts,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [viewingMilestonesGroup, setViewingMilestonesGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  const handleSubmit = (data) => {
    if (editingGroup) {
      onUpdateGroup(editingGroup.id, data);
      setEditingGroup(null);
    } else {
      onCreateGroup(data);
    }
    setIsModalOpen(false);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleRequestDelete = (group) => {
    setGroupToDelete(group);
  };

  const handleCancelDelete = () => {
    setGroupToDelete(null);
  };

  const handleViewMilestones = (group) => {
    setViewingMilestonesGroup(group);
  };

  const handleCloseMilestones = () => {
    setViewingMilestonesGroup(null);
  };

  const handleToggleMilestone = (index) => {
    if (!viewingMilestonesGroup) return;
    const updatedMilestones = viewingMilestonesGroup.milestones.map((m, i) =>
      i === index ? { ...m, completed: !m.completed } : m
    );
    onUpdateGroup(viewingMilestonesGroup.id, { milestones: updatedMilestones });
    setViewingMilestonesGroup({
      ...viewingMilestonesGroup,
      milestones: updatedMilestones,
    });
  };

  const completedMilestonesCount = viewingMilestonesGroup?.milestones.filter((m) => m.completed).length ?? 0;
  const totalMilestones = viewingMilestonesGroup?.milestones.length ?? 0;
  const progressPercent = totalMilestones ? Math.round((completedMilestonesCount / totalMilestones) * 100) : 0;
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
              onEdit={handleEdit}
              onViewMilestones={handleViewMilestones}
              taskCount={taskCounts[group.id] ?? 0}
            />
          ))
        )}
      </div>

      {/* Create/Edit Group Modal */}
      <CreateGroupModal
        isOpen={isModalOpen}
        editingGroup={editingGroup}
        onSubmit={handleSubmit}
        onCancel={handleCancelModal}
      />

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

      {/* View Milestones Modal */}
      {viewingMilestonesGroup && modalRoot ? createPortal((
        <>
          <div className="modal fade show d-block group-modal group-modal--milestones" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable group-modal__dialog group-modal__dialog--milestones">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="group-modal__header-wrapper">
                    <div className="group-modal__header-icon">
                      <i className="bi bi-list-check" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="modal-title">Milestones for {viewingMilestonesGroup.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="modal-body group-modal__body milestones-modal__body">
                  <div className="milestones-summary">
                    <div className="milestone-summary-card">
                      <span>Milestones</span>
                      <strong>{totalMilestones}</strong>
                    </div>
                    <div className="milestone-summary-card">
                      <span>Completed</span>
                      <strong>{completedMilestonesCount}</strong>
                    </div>
                    <div className="milestone-summary-card">
                      <span>Remaining</span>
                      <strong>{totalMilestones - completedMilestonesCount}</strong>
                    </div>
                  </div>

                  <section className="milestones-modal__list-shell">
                    <div className="milestones-modal__list-header">
                      <div>
                        <h4>Single milestones</h4>
                      </div>
                    </div>

                    {viewingMilestonesGroup.milestones.length === 0 ? (
                      <p className="empty-state">No milestones defined.</p>
                    ) : (
                      <div className="milestones-list">
                        {viewingMilestonesGroup.milestones.map((milestone, index) => (
                          <MilestoneItem
                            key={milestone.id ?? index}
                            milestone={milestone}
                            index={index}
                            onToggle={handleToggleMilestone}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
                <div className="modal-footer group-modal__footer">
                  <Button type="button" variant="ghost" onClick={handleCloseMilestones}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show group-modal__backdrop" onClick={handleCloseMilestones} />
        </>
      ), modalRoot) : null}
    </aside>
  );
}

export default GroupList;
