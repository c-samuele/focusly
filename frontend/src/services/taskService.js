// Servizio dedicato ai task.
// Espone le operazioni CRUD e sincronizza ogni modifica con lo storage locale.
import { createTask, getTodayDate } from '../model/Task';
import { firestoreService } from './firestoreService';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const getTasks = async (uid) => firestoreService.listTasks(uid);

const createTaskItem = async (uid, taskData) => {
  const currentTasks = await getTasks(uid);
  const now = new Date().toISOString();

  // In creazione fissiamo sempre gli attributi tecnici mancanti,
  // come id, data di creazione e data pianificata di default.
  const task = createTask({
    ...taskData,
    id: createId(),
    createdAt: now,
    scheduledDate: taskData.scheduledDate || getTodayDate(),
    completed: Boolean(taskData.completed),
    completedAt: taskData.completed ? now : null,
    order: currentTasks.length,
  });

  return firestoreService.createTask(uid, task, task.order);
};

const updateTaskItem = async (uid, taskId, updates) => {
  const tasks = await getTasks(uid);
  const taskToUpdate = tasks.find((task) => task.id === taskId);

  if (!taskToUpdate) {
    return tasks;
  }

  const nextTask = createTask({
    ...taskToUpdate,
    ...updates,
    id: taskToUpdate.id,
    order: taskToUpdate.order,
    completedAt: updates.completed === false ? null : taskToUpdate.completedAt,
    scheduledDate: updates.scheduledDate || taskToUpdate.scheduledDate || getTodayDate(),
  });

  return firestoreService.updateTask(uid, nextTask, taskToUpdate.order);
};

const deleteTaskItem = (uid, taskId) => firestoreService.deleteTask(uid, taskId);

const toggleTaskComplete = async (uid, taskId) => {
  const now = new Date().toISOString();
  const tasks = await getTasks(uid);
  const taskToToggle = tasks.find((task) => task.id === taskId);

  if (!taskToToggle) {
    return tasks;
  }

  const nextCompleted = !taskToToggle.completed;

  // Al cambio di stato salviamo o azzeriamo completedAt,
  // dato usato poi dalle analytics temporali.
  const nextTask = createTask({
    ...taskToToggle,
    completed: nextCompleted,
    completedAt: nextCompleted ? now : null,
  });

  return firestoreService.updateTask(uid, nextTask, taskToToggle.order);
};

const deleteTasksByGroup = (uid, groupId) => firestoreService.deleteTasksByGroup(uid, groupId);

export const taskService = {
  getTasks,
  createTask: createTaskItem,
  updateTask: updateTaskItem,
  deleteTask: deleteTaskItem,
  toggleTaskComplete,
  deleteTasksByGroup,
};
