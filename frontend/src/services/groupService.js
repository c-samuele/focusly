// Servizio dedicato ai gruppi.
// Si occupa di CRUD base e del calcolo dello stato visuale del gruppo.
import { createGroup } from '../model/Group';
import { getTodayDate } from '../model/Task';
import { firestoreService } from './firestoreService';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const getGroups = async (uid) => firestoreService.listGroups(uid);

const sortGroupsByOrder = (groups) => [...groups].sort((left, right) => left.order - right.order);

const createGroupItem = async (uid, groupData, currentGroups = [], currentWorkspaceRevision = 0) => {
  const group = createGroup({
    ...groupData,
    id: createId(),
    status: 'inactive',
    order: currentGroups.length,
  });

  const workspaceRevision = await firestoreService.createGroup(
    uid,
    group,
    group.order,
    currentWorkspaceRevision
  );

  return {
    groups: sortGroupsByOrder([...currentGroups, group]),
    workspaceRevision,
  };
};

const updateGroupItem = async (uid, groupId, updates, currentGroups = [], currentWorkspaceRevision = 0) => {
  const groupToUpdate = currentGroups.find((group) => group.id === groupId);

  if (!groupToUpdate) {
    return {
      groups: currentGroups,
      workspaceRevision: currentWorkspaceRevision,
    };
  }

  const nextGroup = createGroup({
    ...groupToUpdate,
    ...updates,
    id: groupToUpdate.id,
    order: groupToUpdate.order,
  });

  const workspaceRevision = await firestoreService.updateGroup(
    uid,
    nextGroup,
    groupToUpdate.order,
    (groupToUpdate.milestones ?? []).map((milestone) => milestone.id),
    currentWorkspaceRevision
  );

  return {
    groups: sortGroupsByOrder(
      currentGroups.map((group) => (group.id === groupId ? nextGroup : group))
    ),
    workspaceRevision,
  };
};

const deleteGroupItem = async (uid, groupId, currentGroups = [], currentWorkspaceRevision = 0) => {
  const groupToDelete = currentGroups.find((group) => group.id === groupId);
  const milestoneIds = (groupToDelete?.milestones ?? []).map((milestone) => milestone.id);

  const workspaceRevision = await firestoreService.deleteGroup(
    uid,
    groupId,
    milestoneIds,
    currentWorkspaceRevision
  );

  return {
    groups: sortGroupsByOrder(currentGroups.filter((group) => group.id !== groupId)),
    workspaceRevision,
  };
};

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
