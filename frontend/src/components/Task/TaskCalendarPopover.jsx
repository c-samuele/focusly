import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { useDropdownPosition } from '../../hooks/useDropdownPosition';
import TaskCalendar from './TaskCalendar';

function TaskCalendarPopover({
  isOpen,
  onClose,
  triggerElement,
  monthKey,
  onMonthChange,
  selectedDate,
  onSelectDate,
  ariaLabel = 'Task schedule calendar',
}) {
  const { triggerRef, dropdownRef, position } = useDropdownPosition(isOpen);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    triggerRef.current = triggerElement;
  }, [triggerElement, triggerRef]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (triggerElement?.contains(event.target)) {
        return;
      }

      if (dropdownRef.current?.contains(event.target)) {
        return;
      }

      onClose();
    };

    closeTimeoutRef.current = window.setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      window.clearTimeout(closeTimeoutRef.current);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef, isOpen, onClose, triggerElement]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      ref={dropdownRef}
      className="task-calendar-popover"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <TaskCalendar
        monthKey={monthKey}
        onMonthChange={onMonthChange}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        className="task-calendar--portal"
        ariaLabel={ariaLabel}
      />
    </div>,
    document.body
  );
}

export default TaskCalendarPopover;
