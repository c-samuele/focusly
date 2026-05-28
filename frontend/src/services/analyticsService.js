// Servizio per le metriche di studio.
// Produce dati aggregati per card e grafici senza dipendere dai componenti UI.
const getDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDayLabel = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const formatMonthLabel = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });

const getCurrentPeriodBounds = (period) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  // Ogni periodo definisce l'intervallo corrente su cui filtrare i completamenti.
  if (period === 'day') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'week') {
    const day = start.getDay();
    const offset = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getCurrentPeriodLabel = (period) => {
  if (period === 'day') {
    return 'Today';
  }

  if (period === 'week') {
    return 'This Week';
  }

  if (period === 'month') {
    return 'This Month';
  }

  return 'This Year';
};

const getHistoryPeriodBounds = (period) => {
  const bounds = getCurrentPeriodBounds(period);

  if (period === 'day') {
    return { ...bounds, unit: 'day', title: 'History: Today', axisLabel: 'Days' };
  }

  if (period === 'week') {
    return { ...bounds, unit: 'day', title: 'History: Current Week', axisLabel: 'Days' };
  }

  if (period === 'month') {
    return { ...bounds, unit: 'day', title: 'History: Current Month', axisLabel: 'Days' };
  }

  return { ...bounds, unit: 'month', title: 'History: Current Year', axisLabel: 'Months' };
};

const isWithinBounds = (value, bounds) => {
  const date = getDateValue(value);

  if (!date) {
    return false;
  }

  return date >= bounds.start && date <= bounds.end;
};

const buildStudyStats = ({ tasks, groups, period }) => {
  const bounds = getCurrentPeriodBounds(period);
  const plannedTasks = tasks.filter((task) => task.scheduledDate && isWithinBounds(task.scheduledDate, bounds));
  const completedTasks = tasks.filter(
    (task) => task.completed && task.completedAt && isWithinBounds(task.completedAt, bounds)
  );

  // Le statistiche per gruppo considerano solo task completati
  // entro il periodo richiesto, non il carico pianificato.
  const groupStats = groups.map((group) => {
    const groupTasks = completedTasks.filter((task) => task.groupId === group.id);
    const totalMinutes = groupTasks.reduce((sum, task) => sum + (Number(task.timer) || 0), 0);

    return {
      groupId: group.id,
      groupName: group.name,
      groupType: group.type,
      color: group.color,
      completedTasks: groupTasks.length,
      studyMinutes: totalMinutes,
      studyHours: totalMinutes / 60,
    };
  });

  const totalPlannedMinutes = plannedTasks.reduce((sum, task) => sum + (Number(task.timer) || 0), 0);
  const totalMinutes = groupStats.reduce((sum, item) => sum + item.studyMinutes, 0);
  const totalCompletedTasks = groupStats.reduce((sum, item) => sum + item.completedTasks, 0);
  const totalTasks = plannedTasks.length;
  const totalPendingTasks = plannedTasks.filter((task) => !task.completed).length;
  const completionRate =
    totalPlannedMinutes > 0 ? Math.min(100, Math.round((totalMinutes / totalPlannedMinutes) * 100)) : 0;

  return {
    period,
    periodLabel: getCurrentPeriodLabel(period),
    totalPlannedMinutes,
    totalPlannedHours: totalPlannedMinutes / 60,
    totalMinutes,
    totalHours: totalMinutes / 60,
    totalTasks,
    totalCompletedTasks,
    totalPendingTasks,
    completionRate,
    groupStats,
  };
};

const createDailyBuckets = (start, end) => {
  const buckets = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    buckets.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
};

const createMonthlyBuckets = (start, end) => {
  const buckets = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    buckets.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return buckets;
};

const buildHistoryStats = ({ tasks, period }) => {
  const bounds = getHistoryPeriodBounds(period);
  const completedTasks = tasks.filter(
    (task) => task.completed && task.completedAt && isWithinBounds(task.completedAt, bounds)
  );

  // I bucket cambiano in base al periodo:
  // giornalieri per day/week/month, mensili per year.
  const buckets =
    bounds.unit === 'month'
      ? createMonthlyBuckets(bounds.start, bounds.end)
      : createDailyBuckets(bounds.start, bounds.end);

  const labels = buckets.map((bucket) =>
    bounds.unit === 'month' ? formatMonthLabel(bucket) : formatDayLabel(bucket)
  );

  const hours = buckets.map((bucket) => {
    const bucketStart = new Date(bucket);
    const bucketEnd =
      bounds.unit === 'month'
        ? new Date(bucket.getFullYear(), bucket.getMonth() + 1, 0, 23, 59, 59, 999)
        : new Date(bucket.getFullYear(), bucket.getMonth(), bucket.getDate(), 23, 59, 59, 999);

    const bucketTasks = completedTasks.filter((task) => {
      const completedAt = getDateValue(task.completedAt);
      return completedAt && completedAt >= bucketStart && completedAt <= bucketEnd;
    });

    const totalMinutes = bucketTasks.reduce((sum, task) => sum + (Number(task.timer) || 0), 0);
    return totalMinutes / 60;
  });

  const minutes = hours.map((value) => value * 60);
  const totalMinutes = minutes.reduce((sum, value) => sum + value, 0);

  return {
    period,
    title: bounds.title,
    axisLabel: bounds.axisLabel,
    labels,
    hours,
    minutes,
    totalMinutes,
    totalHours: totalMinutes / 60,
    totalCompletedTasks: completedTasks.length,
  };
};

export const analyticsService = {
  buildStudyStats,
  buildHistoryStats,
  getCurrentPeriodBounds,
  isWithinBounds,
};
