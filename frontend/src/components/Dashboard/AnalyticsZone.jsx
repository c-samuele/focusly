import StudyChart from '../Analytics/StudyChart';

function AnalyticsZone({
  stats,
  period,
  onPeriodChange,
  historyStats,
  todaysTasks,
}) {
  return (
    <section className="analytics-zone">
      <StudyChart
        stats={stats}
        period={period}
        onPeriodChange={onPeriodChange}
        historyStats={historyStats}
        todaysTasks={todaysTasks}
        showBreakdown
      />
    </section>
  );
}

export default AnalyticsZone;
