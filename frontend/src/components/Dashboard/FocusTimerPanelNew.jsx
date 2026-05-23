// Pannello timer di focus refactor con sticky position e pulse animation.
// Si posiziona sotto l'header e rimane visibile durante lo scroll.
import { useState } from 'react';
import Button from '../UI/Button';

function FocusTimerPanelNew({
  activeTask,
  isRunning,
  activeTimerLabel,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className={`focus-timer-panel ${isExpanded ? 'focus-timer-panel--expanded' : 'focus-timer-panel--compact'} ${isRunning ? 'focus-timer-panel--pulse' : ''}`}>
      <button
        type="button"
        className="focus-timer-panel__toggle"
        onClick={() => setIsExpanded((current) => !current)}
        aria-label={isExpanded ? 'Riduci timer' : 'Espandi timer'}
        title={isExpanded ? 'Riduci timer' : 'Espandi timer'}
      >
        <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true" />
      </button>

      <div className="focus-timer-panel__content">
        {isExpanded ? (
          <div className="focus-timer-card">
            <span className="focus-timer-card__label">FOCUSING IN</span>
            <h3 className="focus-timer-card__title">{activeTask?.title || 'No active task'}</h3>
            {activeTask?.note && (
              <p className="focus-timer-card__note">{activeTask.note}</p>
            )}
            <div className="focus-timer-card__time">{activeTimerLabel}</div>
            <div className="focus-timer-card__actions">
              {isRunning ? (
                <Button
                  variant="ghost"
                  className="icon-button"
                  onClick={onPauseTimer}
                  aria-label="Metti in pausa timer"
                  title="Metti in pausa timer"
                >
                  <i className="bi bi-pause-fill" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="icon-button"
                  onClick={() => activeTask && onStartTimer(activeTask)}
                  aria-label="Avvia timer"
                  title="Avvia timer"
                >
                  <i className="bi bi-play-fill" aria-hidden="true" />
                </Button>
              )}
              <Button
                variant="ghost"
                className="icon-button"
                onClick={() => activeTask && onResetTimer(activeTask)}
                aria-label="Azzera timer"
                title="Azzera timer"
              >
                <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="focus-timer-panel__compact-content">
            <strong>{activeTimerLabel}</strong>
          </div>
        )}
      </div>
    </section>
  );
}

export default FocusTimerPanelNew;
