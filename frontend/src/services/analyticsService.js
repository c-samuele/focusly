// Servizio per le metriche di studio.
// Produce dati aggregati per card e grafici senza dipendere dai componenti UI.
const getDateValue = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeReferenceDate = (value) => getDateValue(value) ?? new Date();

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

const formatLongDayLabel = (date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatWeekRangeLabel = (start, end) => {
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

const getDayBounds = (referenceDate) => {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getWeekBounds = (referenceDate) => {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const offset = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getMonthBounds = (referenceDate) => {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getYearBounds = (referenceDate) => {
  const start = new Date(referenceDate.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(referenceDate.getFullYear(), 11, 31);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const getCurrentPeriodBounds = (period, referenceDate = new Date()) => {
  const reference = normalizeReferenceDate(referenceDate);

  if (period === 'day') {
    return getDayBounds(reference);
  }

  if (period === 'week') {
    return getWeekBounds(reference);
  }

  if (period === 'month') {
    return getMonthBounds(reference);
  }

  return getYearBounds(reference);
};

const getPeriodLabel = (period, bounds) => {
  if (period === 'day') {
    return formatLongDayLabel(bounds.start);
  }

  if (period === 'week') {
    return formatWeekRangeLabel(bounds.start, bounds.end);
  }

  if (period === 'month') {
    return bounds.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return String(bounds.start.getFullYear());
};

const getHistoryPeriodBounds = (period, referenceDate = new Date()) => {
  const bounds = getCurrentPeriodBounds(period, referenceDate);
  const label = getPeriodLabel(period, bounds);

  if (period === 'day') {
    return { ...bounds, unit: 'day', title: `History: ${label}`, axisLabel: 'Hours of day' };
  }

  if (period === 'week') {
    return { ...bounds, unit: 'day', title: `History: ${label}`, axisLabel: 'Days' };
  }

  if (period === 'month') {
    return { ...bounds, unit: 'day', title: `History: ${label}`, axisLabel: 'Days' };
  }

  return { ...bounds, unit: 'month', title: `History: ${label}`, axisLabel: 'Months' };
};

const isWithinBounds = (value, bounds) => {
  const date = getDateValue(value);

  if (!date) {
    return false;
  }

  return date >= bounds.start && date <= bounds.end;
};

const isCurrentPeriod = (period, referenceDate = new Date(), now = new Date()) => {
  const targetBounds = getCurrentPeriodBounds(period, referenceDate);
  const currentBounds = getCurrentPeriodBounds(period, now);

  return targetBounds.start.getTime() === currentBounds.start.getTime();
};

const shiftPeriodReferenceDate = (period, referenceDate = new Date(), direction = 0) => {
  const reference = normalizeReferenceDate(referenceDate);
  const nextReference = new Date(reference);
  const delta = direction >= 0 ? 1 : -1;

  if (period === 'day') {
    nextReference.setDate(nextReference.getDate() + delta);
    return nextReference;
  }

  if (period === 'week') {
    nextReference.setDate(nextReference.getDate() + (7 * delta));
    return nextReference;
  }

  if (period === 'month') {
    nextReference.setMonth(nextReference.getMonth() + delta);
    return nextReference;
  }

  nextReference.setFullYear(nextReference.getFullYear() + delta);
  return nextReference;
};

const canShiftPeriodForward = (period, referenceDate = new Date(), now = new Date()) => {
  const targetBounds = getCurrentPeriodBounds(period, referenceDate);
  const currentBounds = getCurrentPeriodBounds(period, now);

  return targetBounds.start.getTime() < currentBounds.start.getTime();
};

const buildStudyStats = ({ tasks, groups, period, referenceDate = new Date() }) => {
  const bounds = getCurrentPeriodBounds(period, referenceDate);
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
    periodLabel: getPeriodLabel(period, bounds),
    isCurrentPeriod: isCurrentPeriod(period, referenceDate),
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

const buildHistoryStats = ({ tasks, period, referenceDate = new Date() }) => {
  const bounds = getHistoryPeriodBounds(period, referenceDate);
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
  canShiftPeriodForward,
  getCurrentPeriodBounds,
  isCurrentPeriod,
  isWithinBounds,
  shiftPeriodReferenceDate,
};
