import StudyChart from '../Analytics/StudyChart';

function AnalyticsZone({
  stats,
  period,
  onPeriodChange,
  historyStats,
  periodTasks,
  theme,
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
        showBreakdown
      />
    </section>
  );
}

export default AnalyticsZone;
