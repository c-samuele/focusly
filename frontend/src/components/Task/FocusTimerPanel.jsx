import { useEffect, useRef, useState } from 'react';
import { getGroupAccentStyle } from '../../utils/groupAppearance';
import Button from '../UI/Button';

const FOCUS_TIMER_EXPANDED_KEY = 'focus-timer-expanded';
const FOCUS_TIMER_POSITION_KEY = 'focus-timer-position';
const FLOATING_MARGIN = 18;
const DRAG_THRESHOLD = 6;
const MOBILE_PANEL_MARGIN = 56;

const getDefaultPosition = (panelWidth, panelHeight) => {
  if (typeof window === 'undefined') {
    return { x: FLOATING_MARGIN, y: FLOATING_MARGIN };
  }

  return {
    x: Math.max(FLOATING_MARGIN, window.innerWidth - panelWidth - 24),
    y: Math.max(FLOATING_MARGIN, window.innerHeight - panelHeight - 24),
  };
};

const getViewportMargin = () => {
  if (typeof window === 'undefined') {
    return FLOATING_MARGIN;
  }

  return window.innerWidth <= 640 ? MOBILE_PANEL_MARGIN : FLOATING_MARGIN;
};

const clampPosition = (position, panelWidth, panelHeight) => {
  if (typeof window === 'undefined') {
    return position;
  }

  const viewportMargin = getViewportMargin();
  const maxX = Math.max(FLOATING_MARGIN, window.innerWidth - panelWidth - FLOATING_MARGIN);
  const maxY = Math.max(FLOATING_MARGIN, window.innerHeight - panelHeight - FLOATING_MARGIN);
  const minX = Math.min(FLOATING_MARGIN, Math.max(0, window.innerWidth - panelWidth - viewportMargin));

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, FLOATING_MARGIN), maxY),
  };
};

const readStoredExpanded = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(FOCUS_TIMER_EXPANDED_KEY);
  return stored === null ? true : stored === 'true';
};

const readStoredPosition = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = JSON.parse(window.localStorage.getItem(FOCUS_TIMER_POSITION_KEY) ?? 'null');

    if (
      stored &&
      Number.isFinite(stored.x) &&
      Number.isFinite(stored.y)
    ) {
      return stored;
    }
  } catch (error) {
    // Ignoriamo dati corrotti e torniamo alla posizione di default.
  }

  return null;
};

const isFocusActionTarget = (target) => target instanceof Element && Boolean(target.closest('[data-focus-action="true"]'));

const getTouchById = (touchList, touchId) => {
  if (!touchList || touchId === null || touchId === undefined) {
    return null;
  }

  return Array.from(touchList).find((touch) => touch.identifier === touchId) ?? null;
};

function FocusTimerPanel({
  activeTask,
  activeGroupName,
  activeGroupColor,
  isRunning,
  activeTimerLabel,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
}) {
  const panelRef = useRef(null);
  const dragStateRef = useRef(null);
  const draggedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(readStoredExpanded);
  const [position, setPosition] = useState(readStoredPosition);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FOCUS_TIMER_EXPANDED_KEY, String(isExpanded));
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!position || typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(FOCUS_TIMER_POSITION_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    if (!panelRef.current) {
      return;
    }

    const syncPosition = () => {
      if (!panelRef.current) {
        return;
      }

      const nextWidth = panelRef.current.offsetWidth;
      const nextHeight = panelRef.current.offsetHeight;

      setPosition((current) => {
        const fallback = getDefaultPosition(nextWidth, nextHeight);
        return clampPosition(current ?? fallback, nextWidth, nextHeight);
      });
    };

    syncPosition();
    window.addEventListener('resize', syncPosition);

    return () => {
      window.removeEventListener('resize', syncPosition);
    };
  }, [isExpanded]);

  useEffect(() => {
    const updateDragPosition = (clientX, clientY) => {
      if (!dragStateRef.current || !panelRef.current) {
        return;
      }

      const distanceX = clientX - dragStateRef.current.startX;
      const distanceY = clientY - dragStateRef.current.startY;

      if (!dragStateRef.current.hasMoved) {
        const distance = Math.hypot(distanceX, distanceY);

        if (distance < DRAG_THRESHOLD) {
          return;
        }

        dragStateRef.current.hasMoved = true;
        draggedRef.current = true;
        setIsDragging(true);
      }

      const nextWidth = panelRef.current.offsetWidth;
      const nextHeight = panelRef.current.offsetHeight;

      setPosition(clampPosition({
        x: clientX - dragStateRef.current.offsetX,
        y: clientY - dragStateRef.current.offsetY,
      }, nextWidth, nextHeight));
    };

    const handleMouseMove = (event) => {
      if (!dragStateRef.current || dragStateRef.current.inputType !== 'mouse') {
        return;
      }

      event.preventDefault();
      updateDragPosition(event.clientX, event.clientY);
    };

    const handleTouchMove = (event) => {
      if (!dragStateRef.current || dragStateRef.current.inputType !== 'touch') {
        return;
      }

      const touch = getTouchById(event.touches, dragStateRef.current.touchId);

      if (!touch) {
        return;
      }

      event.preventDefault();
      updateDragPosition(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => {
      if (!dragStateRef.current || dragStateRef.current.inputType !== 'mouse') {
        return;
      }

      stopDragging();
    };

    const handleTouchEnd = (event) => {
      if (!dragStateRef.current || dragStateRef.current.inputType !== 'touch') {
        return;
      }

      const activeTouch = getTouchById(event.touches, dragStateRef.current.touchId);

      if (activeTouch) {
        return;
      }

      stopDragging();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const stopDragging = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const startDragging = (clientX, clientY, inputType, touchId = null) => {
    if (!panelRef.current) {
      return;
    }

    const rect = panelRef.current.getBoundingClientRect();
    draggedRef.current = false;
    dragStateRef.current = {
      inputType,
      touchId,
      startX: clientX,
      startY: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      hasMoved: false,
    };
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    if (isFocusActionTarget(event.target)) {
      return;
    }

    event.preventDefault();
    startDragging(event.clientX, event.clientY, 'mouse');
  };

  const handleTouchStart = (event) => {
    if (isFocusActionTarget(event.target)) {
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    event.preventDefault();
    startDragging(touch.clientX, touch.clientY, 'touch', touch.identifier);
  };

  const handlePanelClick = (event) => {
    if (draggedRef.current) {
      draggedRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (isFocusActionTarget(event.target)) {
      return;
    }

    setIsExpanded((current) => !current);
  };

  const handlePrimaryAction = () => {
    if (!activeTask) {
      return;
    }

    if (isRunning) {
      onPauseTimer();
      return;
    }

    onStartTimer(activeTask);
  };

  const floatingStyle = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : undefined;

  const timerLabel = 'Focus Timer';
  const showBackdrop = isRunning && isExpanded;
  const accentStyle = activeTask && activeGroupColor ? getGroupAccentStyle(activeGroupColor) : undefined;

  return (
    <>
      {showBackdrop ? <div className="floating-focus-timer__backdrop" aria-hidden="true" /> : null}

      <aside
        ref={panelRef}
        className={[
          'floating-focus-timer',
          isExpanded ? 'floating-focus-timer--expanded' : 'floating-focus-timer--compact',
          isDragging ? 'floating-focus-timer--dragging' : '',
          isRunning ? 'floating-focus-timer--active' : '',
        ].filter(Boolean).join(' ')}
        style={{ ...floatingStyle, ...accentStyle }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handlePanelClick}
      >
        <div className="floating-focus-timer__surface">
          <div className="floating-focus-timer__grip" aria-hidden="true">
            <span />
          </div>

          <div
            className={`floating-focus-timer__summary ${isExpanded ? 'floating-focus-timer__summary--expanded' : ''}`.trim()}
          >
            <div className="floating-focus-timer__chrome">
              <div className="floating-focus-timer__handle">
                <span
                  className={`floating-focus-timer__status-dot ${isRunning && activeTask ? 'floating-focus-timer__status-dot--active' : ''}`.trim()}
                  aria-hidden="true"
                />
                <div className="floating-focus-timer__meta">
                  <span className="floating-focus-timer__eyebrow">{timerLabel}</span>
                </div>
              </div>
            </div>

            {!isExpanded ? (
              <div className="floating-focus-timer__compact-content">
                <strong>{activeTimerLabel}</strong>
              </div>
            ) : null}
          </div>

          {isExpanded ? (
            <div className={`focus-timer-card ${activeTask ? '' : 'focus-timer-card--idle'}`.trim()}>
              {activeTask ? (
                <div className="focus-timer-card__header">
                  <span className="focus-timer-card__planned">{activeTask.timer} min plan</span>
                </div>
              ) : null}

              <h4 className="focus-timer-card__title">{activeTask?.title || 'Pick a task and start the timer'}</h4>

              <p className="focus-timer-card__note">
                {activeTask?.note || (activeTask ? 'Stay on this block until the timer rings.' : 'The timer follows the selected task and stays visible while you work.')}
              </p>

              <div className="focus-timer-card__time-row">
                <div className="focus-timer-card__time">{activeTimerLabel}</div>
              </div>

              <div className="focus-timer-card__actions" data-no-drag="true">
                <Button
                  variant={isRunning ? 'ghost' : 'primary'}
                  className="floating-focus-timer__action floating-focus-timer__action--primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePrimaryAction();
                  }}
                  disabled={!activeTask}
                  data-focus-action="true"
                >
                  <i className={`bi ${isRunning ? 'bi-pause-fill' : 'bi-play-fill'}`} aria-hidden="true" />
                  {isRunning ? 'Pause' : 'Start'}
                </Button>

                <Button
                  variant="ghost"
                  className="floating-focus-timer__action"
                  onClick={(event) => {
                    event.stopPropagation();

                    if (activeTask) {
                      onResetTimer(activeTask);
                    }
                  }}
                  disabled={!activeTask}
                  data-focus-action="true"
                >
                  <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                  Reset
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

export default FocusTimerPanel;
