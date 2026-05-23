// Card con 3 mettriche chiave per oggi.
// Mostra totale task, focus time, task completati.
function TodayPillars({
  totalTodayTasks,
  focusTimeCompleted,
  focusTimeTarget,
  completedTodayTasks,
  layout = 'grid',
}) {
  return (
    <div className={`today-pillars ${layout === 'stacked' ? 'today-pillars--stacked' : ''}`.trim()}>
      <div className="pillar-card">
        <div className="pillar-card__icon">
          <i className="bi bi-list-check" aria-hidden="true" />
        </div>
        <div className="pillar-card__content">
          <span className="pillar-card__label">Tasks Today</span>
          <strong className="pillar-card__value">{totalTodayTasks}</strong>
        </div>
      </div>

      <div className="pillar-card">
        <div className="pillar-card__icon">
          <i className="bi bi-clock" aria-hidden="true" />
        </div>
        <div className="pillar-card__content">
          <span className="pillar-card__label">Focus Time</span>
          <strong className="pillar-card__value">
            {focusTimeCompleted} / {focusTimeTarget}h
          </strong>
        </div>
      </div>

      <div className="pillar-card">
        <div className="pillar-card__icon">
          <i className="bi bi-check-circle" aria-hidden="true" />
        </div>
        <div className="pillar-card__content">
          <span className="pillar-card__label">Completed</span>
          <strong className="pillar-card__value">{completedTodayTasks}</strong>
        </div>
      </div>
    </div>
  );
}

export default TodayPillars;
