import { Timestamp } from 'firebase/firestore';
import { createGroup } from '../model/Group';
import { createTask, getTodayDate } from '../model/Task';

const pad = (value) => String(value).padStart(2, '0');

const isDateObject = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const isTimestampLike = (value) =>
  value &&
  typeof value === 'object' &&
  typeof value.toDate === 'function';

const parseDateKey = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateObject = (value) => {
  if (value == null) {
    return null;
  }

  if (isTimestampLike(value)) {
    const date = value.toDate();
    return isDateObject(date) ? date : null;
  }

  if (isDateObject(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const dateOnlyValue = parseDateKey(value);
    if (dateOnlyValue) {
      return dateOnlyValue;
    }

    const parsed = new Date(value);
    return isDateObject(parsed) ? parsed : null;
  }

  return null;
};

const toTimestampOrNull = (value) => {
  const date = toDateObject(value);
  return date ? Timestamp.fromDate(date) : null;
};

const toDateKeyOrFallback = (value, fallback = getTodayDate()) => {
  const date = toDateObject(value);
  if (!date) {
    return fallback;
  }

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const toIsoStringOrNull = (value) => {
  const date = toDateObject(value);
  return date ? date.toISOString() : null;
};

const toNumberOrDefault = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const mapTaskToFirestore = (task = {}, order = 0) => ({
  title: String(task.title ?? ''),
  desc: String(task.desc ?? ''),
  note: String(task.note ?? ''),
  timer: toNumberOrDefault(task.timer, 0),
  completed: Boolean(task.completed),
  priority: task.priority ?? 'medium',
  groupId: String(task.groupId ?? ''),
  order: toNumberOrDefault(task.order, order),
  scheduledDate: toTimestampOrNull(task.scheduledDate),
  createdAt: toTimestampOrNull(task.createdAt) ?? Timestamp.fromDate(new Date()),
  completedAt: task.completed ? toTimestampOrNull(task.completedAt ?? task.createdAt) : null,
  updatedAt: Timestamp.fromDate(new Date()),
});

export const mapTaskFromFirestore = (taskId, data = {}) =>
  createTask({
    id: taskId,
    title: data.title,
    desc: data.desc,
    note: data.note,
    timer: data.timer,
    completed: data.completed,
    priority: data.priority,
    groupId: data.groupId,
    order: toNumberOrDefault(data.order, 0),
    scheduledDate: toDateKeyOrFallback(data.scheduledDate),
    createdAt: toIsoStringOrNull(data.createdAt) ?? new Date().toISOString(),
    completedAt: data.completed ? toIsoStringOrNull(data.completedAt ?? data.createdAt) : null,
  });

export const mapGroupToFirestore = (group = {}, order = 0) => ({
  name: String(group.name ?? ''),
  type: group.type ?? 'custom',
  color: group.color ?? null,
  order: toNumberOrDefault(group.order, order),
  updatedAt: Timestamp.fromDate(new Date()),
});

export const mapGroupFromFirestore = (groupId, data = {}, milestones = []) =>
  createGroup({
    id: groupId,
    name: data.name,
    type: data.type,
    color: data.color,
    status: data.status,
    order: toNumberOrDefault(data.order, 0),
    milestones,
  });

export const mapMilestoneToFirestore = (milestone = {}, order = 0) => ({
  description: String(milestone.description ?? ''),
  completed: Boolean(milestone.completed),
  order: toNumberOrDefault(milestone.order, order),
  updatedAt: Timestamp.fromDate(new Date()),
});

export const mapMilestoneFromFirestore = (milestoneId, data = {}) => ({
  id: milestoneId,
  description: data.description ?? '',
  completed: Boolean(data.completed),
  order: toNumberOrDefault(data.order, 0),
});

export const mapUserProfileFromFirestore = (uid, data = {}) => ({
  uid,
  displayName: data.displayName ?? '',
  email: data.email ?? '',
  photoURL: data.photoURL ?? '',
  createdAt: toIsoStringOrNull(data.createdAt),
  lastLoginAt: toIsoStringOrNull(data.lastLoginAt),
  migration: {
    localStorageImported: Boolean(data.migration?.localStorageImported),
    importedAt: toIsoStringOrNull(data.migration?.importedAt),
    source: data.migration?.source ?? null,
  },
});
