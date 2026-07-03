// Servizio dedicato ai task.
// Espone le operazioni CRUD e sincronizza ogni modifica con lo storage locale.
//
// Come `groupService`, anche questo modulo supporta due modalita:
// - cloud mode: delega la persistenza remota a `firestoreService`
// - guest mode: costruisce e ritorna solo il prossimo snapshot locale
//
// Il vantaggio e che lo store puo invocare sempre la stessa API senza
// doversi preoccupare troppo del canale di persistenza attivo.
import { createTask, getTodayDate } from '../model/Task';
import { firestoreService } from './firestoreService';

// Genera un id lato client per i task appena creati.
const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

// Lettura remota helper, usata quando serve caricare task dal cloud.
const getTasks = async (uid) => firestoreService.listTasks(uid);

// Utility locali per ordinamento e revisione in modalita guest.
const sortTasksByOrder = (tasks) => [...tasks].sort((left, right) => left.order - right.order);
const getNextLocalWorkspaceRevision = (currentWorkspaceRevision = 0) => currentWorkspaceRevision + 1;

// Crea un nuovo task aggiungendo gli attributi tecnici che il form
// non garantisce sempre di fornire.
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

  // In modalita locale non tocchiamo Firestore:
  // aggiorniamo solo lo snapshot del browser e avanziamo la revisione locale.
  if (!uid) {
    return {
      tasks: sortTasksByOrder([...currentTasks, task]),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

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

// Aggiorna un task esistente preservando gli attributi strutturali critici
// come id e order.
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

  if (!uid) {
    return {
      tasks: sortTasksByOrder(
        currentTasks.map((task) => (task.id === taskId ? nextTask : task))
      ),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

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

// Elimina un task singolo.
const deleteTaskItem = async (uid, taskId, currentTasks = [], currentWorkspaceRevision = 0) => {
  if (!uid) {
    return {
      tasks: sortTasksByOrder(currentTasks.filter((task) => task.id !== taskId)),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

  const workspaceRevision = await firestoreService.deleteTask(uid, taskId, currentWorkspaceRevision);

  return {
    tasks: sortTasksByOrder(currentTasks.filter((task) => task.id !== taskId)),
    workspaceRevision,
  };
};

// Toggle del completamento con gestione del timestamp `completedAt`.
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

  if (!uid) {
    return {
      tasks: sortTasksByOrder(
        currentTasks.map((task) => (task.id === taskId ? nextTask : task))
      ),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

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

// Elimina tutti i task appartenenti a un gruppo.
const deleteTasksByGroup = async (uid, groupId, currentTasks = [], currentWorkspaceRevision = 0) => {
  const taskIdsToDelete = currentTasks
    .filter((task) => task.groupId === groupId)
    .map((task) => task.id);

  if (!uid) {
    return {
      tasks: sortTasksByOrder(currentTasks.filter((task) => task.groupId !== groupId)),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

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

// API pubblica dei task.
export const taskService = {
  getTasks,
  createTask: createTaskItem,
  updateTask: updateTaskItem,
  deleteTask: deleteTaskItem,
  toggleTaskComplete,
  deleteTasksByGroup,
};
