// Servizio dedicato ai task.
// Espone le operazioni CRUD e sincronizza ogni modifica con lo storage locale.
import { createTask, getTodayDate } from '../model/Task';
import { storageService } from './storageService';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const getTasks = () => storageService.getAppData().tasks.map(createTask);

const saveTasks = (tasks) => {
  const nextTasks = tasks.map(createTask);
  storageService.updateAppData((data) => ({
    ...data,
    tasks: nextTasks,
  }));
  return getTasks();
};

const createTaskItem = (taskData) => {
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
  });

  return saveTasks([...getTasks(), task]);
};

const updateTaskItem = (taskId, updates) => {
  const tasks = getTasks().map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    // L'update conserva i campi strutturali sensibili
    // e aggiorna completedAt solo quando il task viene riaperto.
    return createTask({
      ...task,
      ...updates,
      id: task.id,
      completedAt: updates.completed === false ? null : task.completedAt,
      scheduledDate: updates.scheduledDate || task.scheduledDate || getTodayDate(),
    });
  });

  return saveTasks(tasks);
};

const deleteTaskItem = (taskId) => saveTasks(getTasks().filter((task) => task.id !== taskId));

const toggleTaskComplete = (taskId) => {
  const now = new Date().toISOString();
  const tasks = getTasks().map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const nextCompleted = !task.completed;

    // Al cambio di stato salviamo o azzeriamo completedAt,
    // dato usato poi dalle analytics temporali.
    return createTask({
      ...task,
      completed: nextCompleted,
      completedAt: nextCompleted ? now : null,
    });
  });

  return saveTasks(tasks);
};

const deleteTasksByGroup = (groupId) => saveTasks(getTasks().filter((task) => task.groupId !== groupId));

export const taskService = {
  getTasks,
  createTask: createTaskItem,
  updateTask: updateTaskItem,
  deleteTask: deleteTaskItem,
  toggleTaskComplete,
  deleteTasksByGroup,
};
