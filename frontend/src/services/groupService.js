// Servizio dedicato ai gruppi.
// Si occupa di CRUD base e del calcolo dello stato visuale del gruppo.
//
// Questo modulo non parla con Firestore direttamente in tutti i casi:
// - in modalita cloud delega a `firestoreService`
// - in modalita guest aggiorna solo il modello locale ritornando
//   il prossimo snapshot atteso allo store
//
// In altre parole, e un adapter tra business logic "group-centric"
// e canale di persistenza attivo (cloud o locale).
import { createGroup } from '../model/Group';
import { getTodayDate } from '../model/Task';
import { firestoreService } from './firestoreService';

// Genera un id client-side per i gruppi nuovi.
const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

// Lettura remota helper, usata quando serve caricare gruppi dal cloud.
const getGroups = async (uid) => firestoreService.listGroups(uid);

// Utility locali per mantenere ordine e revisione coerenti.
const sortGroupsByOrder = (groups) => [...groups].sort((left, right) => left.order - right.order);
const getNextLocalWorkspaceRevision = (currentWorkspaceRevision = 0) => currentWorkspaceRevision + 1;

// Crea un gruppo nuovo, con fallback locale se non esiste un `uid`.
const createGroupItem = async (uid, groupData, currentGroups = [], currentWorkspaceRevision = 0) => {
  const group = createGroup({
    ...groupData,
    id: createId(),
    status: 'inactive',
    order: currentGroups.length,
  });

  if (!uid) {
    return {
      groups: sortGroupsByOrder([...currentGroups, group]),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

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

// Aggiorna un gruppo esistente mantenendo id e order stabili.
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

  if (!uid) {
    return {
      groups: sortGroupsByOrder(
        currentGroups.map((group) => (group.id === groupId ? nextGroup : group))
      ),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

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

// Elimina un gruppo. In cloud mode lascia a Firestore anche la pulizia
// delle milestone, in guest mode restituisce solo il nuovo snapshot locale.
const deleteGroupItem = async (uid, groupId, currentGroups = [], currentWorkspaceRevision = 0) => {
  const groupToDelete = currentGroups.find((group) => group.id === groupId);
  const milestoneIds = (groupToDelete?.milestones ?? []).map((milestone) => milestone.id);

  if (!uid) {
    return {
      groups: sortGroupsByOrder(currentGroups.filter((group) => group.id !== groupId)),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

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

// Riordina i gruppi aggiornando l'attributo `order`.
const reorderGroups = async (uid, nextGroups = [], currentWorkspaceRevision = 0) => {
  const reorderedGroups = nextGroups.map((group, index) => createGroup({
    ...group,
    order: index,
  }));

  if (!uid) {
    return {
      groups: sortGroupsByOrder(reorderedGroups),
      workspaceRevision: getNextLocalWorkspaceRevision(currentWorkspaceRevision),
    };
  }

  const workspaceRevision = await firestoreService.reorderGroups(
    uid,
    reorderedGroups,
    currentWorkspaceRevision
  );

  return {
    groups: sortGroupsByOrder(reorderedGroups),
    workspaceRevision,
  };
};

// Stato derivato del gruppo calcolato a partire dai task del giorno.
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

// Applica lo stato derivato a tutti i gruppi.
const attachStatuses = (groups, tasks) =>
  // Lo stato non viene persisito come fonte di verità:
  // viene ricalcolato ogni volta a partire dai task correnti.
  groups.map((group) =>
    createGroup({
      ...group,
      status: getGroupStatus(group.id, tasks),
    })
  );

// API pubblica dei gruppi.
export const groupService = {
  getGroups,
  createGroup: createGroupItem,
  updateGroup: updateGroupItem,
  deleteGroup: deleteGroupItem,
  reorderGroups,
  getGroupStatus,
  attachStatuses,
};
