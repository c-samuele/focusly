// Pannello flottante del timer di focus.
// Può essere compattato o espanso e controlla il task attualmente in esecuzione.
import { useState } from 'react';
import Button from '../UI/Button';

function FocusTimerPanel({
  activeTask,
  isRunning,
  activeTimerLabel,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside className={`floating-focus-timer ${isExpanded ? 'floating-focus-timer--expanded' : 'floating-focus-timer--compact'}`}>
      {/* Il toggle permette di lasciare il timer a schermo occupando poco spazio. */}
      <button
        type="button"
        className="floating-focus-timer__toggle"
        onClick={() => setIsExpanded((current) => !current)}
        aria-label={isExpanded ? 'Riduci timer' : 'Espandi timer'}
        title={isExpanded ? 'Riduci timer' : 'Espandi timer'}
      >
        <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-up'}`} aria-hidden="true" />
      </button>

      <div className="task-focus-panel">
        {isExpanded ? (
          <div className="focus-timer-card">
            <span className="focus-timer-card__label">FOCUSING IN</span>
            <h4 className="focus-timer-card__title">{activeTask?.title || 'No active task'}</h4>
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
          <div className="floating-focus-timer__compact-content">
            <strong>{activeTimerLabel}</strong>
          </div>
        )}
      </div>
    </aside>
  );
}

export default FocusTimerPanel;
