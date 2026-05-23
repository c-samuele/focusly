// Sidebar laterale per i gruppi di studio.
// Su desktop è fixed a sinistra, su tablet/mobile è un drawer.
import GroupList from '../Group/GroupList';

function Sidebar({
  isOpen,
  onClose,
  groups,
  selectedGroupId,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onSelectGroup,
  taskCounts,
}) {
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
        <GroupList
          groups={groups}
          selectedGroupId={selectedGroupId}
          onCreateGroup={onCreateGroup}
          onUpdateGroup={onUpdateGroup}
          onDeleteGroup={onDeleteGroup}
          onSelectGroup={onSelectGroup}
          onViewMilestones={() => {}}
          taskCounts={taskCounts}
        />
      </aside>
    </>
  );
}

export default Sidebar;
