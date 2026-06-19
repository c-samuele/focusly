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
  onShiftBackward,
  onShiftForward,
  canShiftForward,
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
        onShiftBackward={onShiftBackward}
        onShiftForward={onShiftForward}
        canShiftForward={canShiftForward}
        showBreakdown
      />
    </section>
  );
}

export default AnalyticsZone;
