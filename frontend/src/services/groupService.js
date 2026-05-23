// Servizio dedicato ai gruppi.
// Si occupa di CRUD base e del calcolo dello stato visuale del gruppo.
import { createGroup } from '../model/Group';
import { getTodayDate } from '../model/Task';
import { storageService } from './storageService';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const getGroups = () => storageService.getAppData().groups.map(createGroup);

const saveGroups = (groups) => {
  const nextGroups = groups.map(createGroup);
  storageService.updateAppData((data) => ({
    ...data,
    groups: nextGroups,
  }));
  return getGroups();
};

const createGroupItem = (groupData) => {
  const group = createGroup({
    ...groupData,
    id: createId(),
    status: 'inactive',
  });

  return saveGroups([...getGroups(), group]);
};

const updateGroupItem = (groupId, updates) => {
  const groups = getGroups().map(group =>
    group.id === groupId ? createGroup({ ...group, ...updates }) : group
  );
  return saveGroups(groups);
};

const deleteGroupItem = (groupId) => saveGroups(getGroups().filter((group) => group.id !== groupId));

const getGroupStatus = (groupId, tasks) => {
  const groupTasks = tasks.filter((task) => task.groupId === groupId);
  const todaysTasks = groupTasks.filter((task) => task.scheduledDate === getTodayDate());

  // Nessun task associato: il gruppo risulta inattivo.
  if (todaysTasks.length === 0) {
    return 'inactive';
  }

  // Il gruppo è completato solo se esistono task di oggi
  // e tutti quelli di oggi risultano completati.
  if (todaysTasks.length > 0 && todaysTasks.every((task) => task.completed)) {
    return 'completed';
  }

  // In tutti gli altri casi il gruppo è considerato in corso.
  return 'in_progress';
};

const attachStatuses = (groups, tasks) =>
  // Lo stato non viene persisito come fonte di verità:
  // viene ricalcolato ogni volta a partire dai task correnti.
  groups.map((group) =>
    createGroup({
      ...group,
      status: getGroupStatus(group.id, tasks),
    })
  );

export const groupService = {
  getGroups,
  createGroup: createGroupItem,
  updateGroup: updateGroupItem,
  deleteGroup: deleteGroupItem,
  getGroupStatus,
  attachStatuses,
};
