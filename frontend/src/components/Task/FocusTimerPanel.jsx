import { useEffect, useRef, useState } from 'react';
import Button from '../UI/Button';

const FOCUS_TIMER_EXPANDED_KEY = 'focus-timer-expanded';
const FOCUS_TIMER_POSITION_KEY = 'focus-timer-position';
const FLOATING_MARGIN = 18;

const getDefaultPosition = (panelWidth, panelHeight) => {
  if (typeof window === 'undefined') {
    return { x: FLOATING_MARGIN, y: FLOATING_MARGIN };
  }

  return {
    x: Math.max(FLOATING_MARGIN, window.innerWidth - panelWidth - 24),
    y: Math.max(FLOATING_MARGIN, window.innerHeight - panelHeight - 24),
  };
};

const clampPosition = (position, panelWidth, panelHeight) => {
  if (typeof window === 'undefined') {
    return position;
  }

  const maxX = Math.max(FLOATING_MARGIN, window.innerWidth - panelWidth - FLOATING_MARGIN);
  const maxY = Math.max(FLOATING_MARGIN, window.innerHeight - panelHeight - FLOATING_MARGIN);

  return {
    x: Math.min(Math.max(position.x, FLOATING_MARGIN), maxX),
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

function FocusTimerPanel({
  activeTask,
  isRunning,
  activeTimerLabel,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
}) {
  const panelRef = useRef(null);
  const dragStateRef = useRef(null);
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

  const stopDragging = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target.closest('[data-no-drag="true"]')) {
      return;
    }

    if (!panelRef.current) {
      return;
    }

    const rect = panelRef.current.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    panelRef.current.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId || !panelRef.current) {
      return;
    }

    event.preventDefault();

    const nextWidth = panelRef.current.offsetWidth;
    const nextHeight = panelRef.current.offsetHeight;

    setPosition(clampPosition({
      x: event.clientX - dragStateRef.current.offsetX,
      y: event.clientY - dragStateRef.current.offsetY,
    }, nextWidth, nextHeight));
  };

  const handlePointerUp = (event) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    panelRef.current?.releasePointerCapture?.(event.pointerId);
    stopDragging();
  };

  const handleToggleExpanded = () => {
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

  const timerStatus = isRunning ? 'Running' : activeTask ? 'Paused' : 'Idle';

  return (
    <aside
      ref={panelRef}
      className={[
        'floating-focus-timer',
        isExpanded ? 'floating-focus-timer--expanded' : 'floating-focus-timer--compact',
        isDragging ? 'floating-focus-timer--dragging' : '',
        isRunning ? 'floating-focus-timer--active' : '',
      ].filter(Boolean).join(' ')}
      style={floatingStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={stopDragging}
    >
      <div className="floating-focus-timer__surface">
        <div className="floating-focus-timer__chrome">
          <div className="floating-focus-timer__handle">
            <span className="floating-focus-timer__status-dot" aria-hidden="true" />
            <div className="floating-focus-timer__meta">
              <span className="floating-focus-timer__eyebrow">Focus Timer</span>
              <strong className="floating-focus-timer__status">{timerStatus}</strong>
            </div>
          </div>

          <button
            type="button"
            className="floating-focus-timer__toggle"
            onClick={handleToggleExpanded}
            aria-label={isExpanded ? 'Reduce focus timer' : 'Expand focus timer'}
            title={isExpanded ? 'Reduce focus timer' : 'Expand focus timer'}
            data-no-drag="true"
          >
            <i className={`bi ${isExpanded ? 'bi-dash-lg' : 'bi-plus-lg'}`} aria-hidden="true" />
          </button>
        </div>

        {isExpanded ? (
          <div className={`focus-timer-card ${activeTask ? '' : 'focus-timer-card--idle'}`.trim()}>
            <div className="focus-timer-card__header">
              <span className="focus-timer-card__label">{activeTask ? 'Current Session' : 'Ready to Focus'}</span>
              {activeTask ? (
                <span className="focus-timer-card__planned">{activeTask.timer} min plan</span>
              ) : null}
            </div>

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
                onClick={handlePrimaryAction}
                disabled={!activeTask}
              >
                <i className={`bi ${isRunning ? 'bi-pause-fill' : 'bi-play-fill'}`} aria-hidden="true" />
                {isRunning ? 'Pause' : 'Start'}
              </Button>

              <Button
                variant="ghost"
                className="floating-focus-timer__action"
                onClick={() => activeTask && onResetTimer(activeTask)}
                disabled={!activeTask}
              >
                <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="floating-focus-timer__compact-content">
            <span className="floating-focus-timer__compact-status">{timerStatus}</span>
            <strong>{activeTimerLabel}</strong>
          </div>
        )}
      </div>
    </aside>
  );
}

export default FocusTimerPanel;
