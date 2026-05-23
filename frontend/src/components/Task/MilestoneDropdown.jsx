import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { useDropdownPosition } from '../../hooks/useDropdownPosition';

/**
 * Dropdown portale per le milestone
 * Si posiziona intelligentemente (sopra o sotto) e non causa scroll della pagina
 * Supporta scroll interno per molte milestone
 */
function MilestoneDropdown({ isOpen, onClose, milestones, onSelectMilestone, triggerElement }) {
  const { triggerRef, dropdownRef, position } = useDropdownPosition(isOpen);
  const closeTimeoutRef = useRef(null);

  // Sync il trigger ref dall'elemento esterno
  useEffect(() => {
    triggerRef.current = triggerElement;
  }, [triggerElement, triggerRef]);

  // Chiudi il dropdown quando si clicca fuori
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Se il click è sul trigger (il button Milestone), non chiudere
      if (triggerElement?.contains(event.target)) {
        return;
      }

      // Se il click è dentro il dropdown, non chiudere (gestito da onSelectMilestone)
      if (dropdownRef.current?.contains(event.target)) {
        return;
      }

      onClose();
    };

    // Aggiungi un piccolo delay per evitare chiusure immediate
    closeTimeoutRef.current = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(closeTimeoutRef.current);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerElement]);

  // Supporto per ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen || milestones.length === 0) {
    return null;
  }

  return createPortal(
    <div
      ref={dropdownRef}
      className="milestone-dropdown"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="listbox"
    >
      {milestones.map((milestone, idx) => (
        <button
          key={idx}
          type="button"
          className="milestone-dropdown__item"
          onClick={() => {
            onSelectMilestone(milestone);
            onClose();
          }}
          role="option"
        >
          {milestone.description}
        </button>
      ))}
    </div>,
    document.body
  );
}

export default MilestoneDropdown;
