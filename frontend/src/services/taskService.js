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

const sortTasksByOrder = (tasks) => [...tasks].sort((left, right) => left.order - right.order);

const createTaskItem = async (uid, taskData, currentTasks = [], currentWorkspaceRevision = 0) => {
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

  const workspaceRevision = await firestoreService.createTask(
    uid,
    task,
    task.order,
    currentWorkspaceRevision
  );

  return {
    tasks: sortTasksByOrder([...currentTasks, task]),
    workspaceRevision,
  };
};

const updateTaskItem = async (uid, taskId, updates, currentTasks = [], currentWorkspaceRevision = 0) => {
  const taskToUpdate = currentTasks.find((task) => task.id === taskId);

  if (!taskToUpdate) {
    return {
      tasks: currentTasks,
      workspaceRevision: currentWorkspaceRevision,
    };
  }

  const nextTask = createTask({
    ...taskToUpdate,
    ...updates,
    id: taskToUpdate.id,
    order: taskToUpdate.order,
    completedAt: updates.completed === false ? null : taskToUpdate.completedAt,
    scheduledDate: updates.scheduledDate || taskToUpdate.scheduledDate || getTodayDate(),
  });

  const workspaceRevision = await firestoreService.updateTask(
    uid,
    nextTask,
    taskToUpdate.order,
    currentWorkspaceRevision
  );

  return {
    tasks: sortTasksByOrder(
      currentTasks.map((task) => (task.id === taskId ? nextTask : task))
    ),
    workspaceRevision,
  };
};

const deleteTaskItem = async (uid, taskId, currentTasks = [], currentWorkspaceRevision = 0) => {
  const workspaceRevision = await firestoreService.deleteTask(uid, taskId, currentWorkspaceRevision);

  return {
    tasks: sortTasksByOrder(currentTasks.filter((task) => task.id !== taskId)),
    workspaceRevision,
  };
};

const toggleTaskComplete = async (uid, taskId, currentTasks = [], currentWorkspaceRevision = 0) => {
  const now = new Date().toISOString();
  const taskToToggle = currentTasks.find((task) => task.id === taskId);

  if (!taskToToggle) {
    return {
      tasks: currentTasks,
      workspaceRevision: currentWorkspaceRevision,
    };
  }

  const nextCompleted = !taskToToggle.completed;

  // Al cambio di stato salviamo o azzeriamo completedAt,
  // dato usato poi dalle analytics temporali.
  const nextTask = createTask({
    ...taskToToggle,
    completed: nextCompleted,
    completedAt: nextCompleted ? now : null,
  });

  const workspaceRevision = await firestoreService.updateTask(
    uid,
    nextTask,
    taskToToggle.order,
    currentWorkspaceRevision
  );

  return {
    tasks: sortTasksByOrder(
      currentTasks.map((task) => (task.id === taskId ? nextTask : task))
    ),
    workspaceRevision,
  };
};

const deleteTasksByGroup = async (uid, groupId, currentTasks = [], currentWorkspaceRevision = 0) => {
  const taskIdsToDelete = currentTasks
    .filter((task) => task.groupId === groupId)
    .map((task) => task.id);

  const workspaceRevision = await firestoreService.deleteTasksByGroup(
    uid,
    groupId,
    taskIdsToDelete,
    currentWorkspaceRevision
  );

  return {
    tasks: sortTasksByOrder(currentTasks.filter((task) => task.groupId !== groupId)),
    workspaceRevision,
  };
};

export const taskService = {
  getTasks,
  createTask: createTaskItem,
  updateTask: updateTaskItem,
  deleteTask: deleteTaskItem,
  toggleTaskComplete,
  deleteTasksByGroup,
};
