import StudyChart from '../Analytics/StudyChart';

function AnalyticsZone({
  stats,
  period,
  onPeriodChange,
  historyStats,
  periodTasks,
  theme,
  activeTaskId,
  isRunning,
  onStartTimer,
  onPauseTimer,
}) {
  return (
    <section className="analytics-zone">
      <StudyChart
        stats={stats}
        period={period}
        onPeriodChange={onPeriodChange}
        historyStats={historyStats}
        periodTasks={periodTasks}
        theme={theme}
        activeTaskId={activeTaskId}
        isRunning={isRunning}
        onStartTimer={onStartTimer}
        onPauseTimer={onPauseTimer}
        showBreakdown
      />
    </section>
  );
}

export default AnalyticsZone;
