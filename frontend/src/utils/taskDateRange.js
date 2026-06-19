import { getTodayDate } from '../model/Task';

const parseDateKey = (value) => {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return new Date(`${getTodayDate()}T12:00:00`);
  }

  return date;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDateKey = (value, amount) => {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

const addMonthsToDateKey = (value, amount) => {
  const date = parseDateKey(value);
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  return toDateKey(date);
};

const getWeekStartKey = (value) => {
  const date = parseDateKey(value);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return toDateKey(date);
};

const getWeekEndKey = (value) => addDaysToDateKey(getWeekStartKey(value), 6);

const getMonthStartKey = (value) => {
  const date = parseDateKey(value);
  date.setDate(1);
  return toDateKey(date);
};

const getMonthEndKey = (value) => {
  const date = parseDateKey(getMonthStartKey(value));
  date.setMonth(date.getMonth() + 1, 0);
  return toDateKey(date);
};

const isDateWithinRange = (value, start, end) => value >= start && value <= end;

const isSameMonthKey = (left, right) => left.slice(0, 7) === right.slice(0, 7);

const formatDayLabel = (value) =>
  parseDateKey(value).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatWeekLabel = (value) => {
  const start = parseDateKey(getWeekStartKey(value));
  const end = parseDateKey(getWeekEndKey(value));

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const formatMonthLabel = (value) =>
  parseDateKey(getMonthStartKey(value)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

export {
  addDaysToDateKey,
  addMonthsToDateKey,
  formatDayLabel,
  formatMonthLabel,
  formatWeekLabel,
  getMonthEndKey,
  getMonthStartKey,
  getWeekEndKey,
  getWeekStartKey,
  isDateWithinRange,
  isSameMonthKey,
};
