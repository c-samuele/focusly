// Sidebar laterale per i gruppi di studio.
// Su desktop è fixed a sinistra, su tablet/mobile è un drawer.
import { useEffect } from 'react';
import Button from '../UI/Button';
import GroupList from '../Group/GroupList';

function Sidebar({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  onOpenCreateGroup,
  onOpenEditGroup,
  onOpenViewMilestones,
  onDeleteGroup,
  onReorderGroups,
  onSelectGroup,
  taskCounts,
}) {
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay per mobile/tablet quando drawer è aperto */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__sheet-header">
          <div>
            <span className="sidebar__sheet-eyebrow">Workspace</span>
            <strong>Groups</strong>
          </div>
          <Button
            variant="ghost"
            className="sidebar__sheet-close icon-button"
            onClick={onClose}
            aria-label="Chiudi gruppi"
            title="Chiudi gruppi"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </Button>
        </div>

        <GroupList
          groups={groups}
          selectedGroupId={selectedGroupId}
          onOpenCreateGroup={onOpenCreateGroup}
          onOpenEditGroup={onOpenEditGroup}
          onOpenViewMilestones={onOpenViewMilestones}
          onDeleteGroup={onDeleteGroup}
          onReorderGroups={onReorderGroups}
          onSelectGroup={onSelectGroup}
          taskCounts={taskCounts}
        />
      </aside>
    </>
  );
}

export default Sidebar;
