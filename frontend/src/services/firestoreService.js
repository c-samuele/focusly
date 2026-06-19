import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  mapGroupFromFirestore,
  mapGroupToFirestore,
  mapMilestoneFromFirestore,
  mapMilestoneToFirestore,
  mapTaskFromFirestore,
  mapTaskToFirestore,
  mapUserProfileFromFirestore,
} from './firestoreMappers';

const getUserRef = (uid) => doc(db, 'users', uid);
const getTasksCollectionRef = (uid) => collection(db, 'users', uid, 'tasks');
const getTaskRef = (uid, taskId) => doc(db, 'users', uid, 'tasks', taskId);
const getGroupsCollectionRef = (uid) => collection(db, 'users', uid, 'groups');
const getGroupRef = (uid, groupId) => doc(db, 'users', uid, 'groups', groupId);
const getMilestonesCollectionRef = (uid, groupId) => collection(db, 'users', uid, 'groups', groupId, 'milestones');
const getMilestoneRef = (uid, groupId, milestoneId) => doc(db, 'users', uid, 'groups', groupId, 'milestones', milestoneId);
const normalizeWorkspaceRevision = (value) => (
  Number.isFinite(Number(value)) ? Number(value) : 0
);

const queueWorkspaceRevisionUpdate = (batch, uid) => {
  batch.set(
    getUserRef(uid),
    {
      workspaceRevision: increment(1),
    },
    { merge: true }
  );
};

const listMilestones = async (uid, groupId) => {
  const snapshot = await getDocs(query(getMilestonesCollectionRef(uid, groupId), orderBy('order', 'asc')));
  return snapshot.docs.map((docSnapshot) => mapMilestoneFromFirestore(docSnapshot.id, docSnapshot.data()));
};

const syncMilestonesForGroup = async (
  uid,
  groupId,
  milestones = [],
  { mergeOnly = false, previousMilestoneIds } = {},
  existingBatch = null
) => {
  const milestonesRef = getMilestonesCollectionRef(uid, groupId);
  const batch = existingBatch ?? writeBatch(db);
  const nextIds = new Set(milestones.map((milestone) => milestone.id));

  if (!mergeOnly) {
    if (Array.isArray(previousMilestoneIds)) {
      previousMilestoneIds.forEach((milestoneId) => {
        if (!nextIds.has(milestoneId)) {
          batch.delete(getMilestoneRef(uid, groupId, milestoneId));
        }
      });
    } else {
      const existingSnapshot = await getDocs(milestonesRef);
      existingSnapshot.forEach((docSnapshot) => {
        if (!nextIds.has(docSnapshot.id)) {
          batch.delete(docSnapshot.ref);
        }
      });
    }
  }

  milestones.forEach((milestone, index) => {
    batch.set(
      getMilestoneRef(uid, groupId, milestone.id),
      mapMilestoneToFirestore(milestone, index),
      { merge: true }
    );
  });

  if (!existingBatch) {
    await batch.commit();
  }
};

const listTasks = async (uid) => {
  const snapshot = await getDocs(query(getTasksCollectionRef(uid), orderBy('order', 'asc')));
  return snapshot.docs.map((docSnapshot) => mapTaskFromFirestore(docSnapshot.id, docSnapshot.data()));
};

const listGroups = async (uid) => {
  const snapshot = await getDocs(query(getGroupsCollectionRef(uid), orderBy('order', 'asc')));
  const groups = await Promise.all(
    snapshot.docs.map(async (docSnapshot) => {
      const milestones = await listMilestones(uid, docSnapshot.id);
      return mapGroupFromFirestore(docSnapshot.id, docSnapshot.data(), milestones);
    })
  );

  return groups;
};

const getUserProfile = async (uid) => {
  const snapshot = await getDoc(getUserRef(uid));
  if (!snapshot.exists()) {
    return null;
  }

  return mapUserProfileFromFirestore(uid, snapshot.data());
};

const upsertUserProfile = async (user) => {
  const userRef = getUserRef(user.uid);
  const snapshot = await getDoc(userRef);
  const currentData = snapshot.exists() ? snapshot.data() : null;

  const payload = {
    displayName: user.displayName ?? currentData?.displayName ?? '',
    email: user.email ?? currentData?.email ?? '',
    photoURL: user.photoURL ?? currentData?.photoURL ?? '',
    lastLoginAt: serverTimestamp(),
    workspaceRevision: normalizeWorkspaceRevision(currentData?.workspaceRevision),
  };

  if (!snapshot.exists()) {
    payload.createdAt = serverTimestamp();
    payload.migration = {
      localStorageImported: false,
      importedAt: null,
      source: null,
    };
  } else if (currentData?.migration) {
    payload.migration = currentData.migration;
  }

  await setDoc(userRef, payload, { merge: true });
  return mapUserProfileFromFirestore(user.uid, {
    ...currentData,
    displayName: payload.displayName,
    email: payload.email,
    photoURL: payload.photoURL,
    createdAt: currentData?.createdAt ?? new Date(),
    lastLoginAt: new Date(),
    workspaceRevision: normalizeWorkspaceRevision(currentData?.workspaceRevision),
    migration: payload.migration ?? currentData?.migration ?? {
      localStorageImported: false,
      importedAt: null,
      source: null,
    },
  });
};

const loadUserData = async (uid, userProfile = null) => {
  const [resolvedUserProfile, tasks, groups] = await Promise.all([
    userProfile ? Promise.resolve(userProfile) : getUserProfile(uid),
    listTasks(uid),
    listGroups(uid),
  ]);

  return {
    userProfile: resolvedUserProfile,
    tasks,
    groups,
  };
};

const markMigrationComplete = async (uid, source = 'localStorage') => {
  await setDoc(
    getUserRef(uid),
    {
      migration: {
        localStorageImported: true,
        importedAt: serverTimestamp(),
        source,
      },
    },
    { merge: true }
  );
};

const importLocalData = async (uid, appData, { source = 'localStorage', mergeOnly = true } = {}) => {
  const tasks = Array.isArray(appData?.tasks) ? appData.tasks : [];
  const groups = Array.isArray(appData?.groups) ? appData.groups : [];

  if (!tasks.length && !groups.length) {
    await markMigrationComplete(uid, source);
    return;
  }

  const batch = writeBatch(db);

  tasks.forEach((task, index) => {
    batch.set(
      getTaskRef(uid, task.id),
      mapTaskToFirestore(task, index),
      { merge: true }
    );
  });

  groups.forEach((group, groupIndex) => {
    batch.set(
      getGroupRef(uid, group.id),
      mapGroupToFirestore(group, groupIndex),
      { merge: true }
    );

    (group.milestones ?? []).forEach((milestone, milestoneIndex) => {
      batch.set(
        getMilestoneRef(uid, group.id, milestone.id),
        mapMilestoneToFirestore(milestone, milestoneIndex),
        { merge: true }
      );
    });
  });

  queueWorkspaceRevisionUpdate(batch, uid);
  batch.set(
    getUserRef(uid),
    {
      migration: {
        localStorageImported: true,
        importedAt: serverTimestamp(),
        source,
      },
    },
    { merge: true }
  );

  await batch.commit();

  if (!mergeOnly) {
    await Promise.all(
      groups.map((group) =>
        syncMilestonesForGroup(uid, group.id, group.milestones ?? [], { mergeOnly: false })
      )
    );
  }

};

const createTask = async (uid, task, order, currentWorkspaceRevision = 0) => {
  const batch = writeBatch(db);
  batch.set(getTaskRef(uid, task.id), mapTaskToFirestore(task, order), { merge: true });
  queueWorkspaceRevisionUpdate(batch, uid);
  await batch.commit();
  return normalizeWorkspaceRevision(currentWorkspaceRevision) + 1;
};

const updateTask = async (uid, task, order, currentWorkspaceRevision = 0) => {
  const batch = writeBatch(db);
  batch.set(getTaskRef(uid, task.id), mapTaskToFirestore(task, order), { merge: true });
  queueWorkspaceRevisionUpdate(batch, uid);
  await batch.commit();
  return normalizeWorkspaceRevision(currentWorkspaceRevision) + 1;
};

const deleteTask = async (uid, taskId, currentWorkspaceRevision = 0) => {
  const batch = writeBatch(db);
  batch.delete(getTaskRef(uid, taskId));
  queueWorkspaceRevisionUpdate(batch, uid);
  await batch.commit();
  return normalizeWorkspaceRevision(currentWorkspaceRevision) + 1;
};

const deleteTasksByGroup = async (uid, groupId, taskIds = null, currentWorkspaceRevision = 0) => {
  const batch = writeBatch(db);

  if (Array.isArray(taskIds)) {
    taskIds.forEach((taskId) => {
      batch.delete(getTaskRef(uid, taskId));
    });
  } else {
    const snapshot = await getDocs(query(getTasksCollectionRef(uid), where('groupId', '==', groupId)));
    snapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
  }

  queueWorkspaceRevisionUpdate(batch, uid);
  await batch.commit();
  return normalizeWorkspaceRevision(currentWorkspaceRevision) + 1;
};

const createGroup = async (uid, group, order, currentWorkspaceRevision = 0) => {
  const batch = writeBatch(db);
  batch.set(getGroupRef(uid, group.id), mapGroupToFirestore(group, order), { merge: true });
  queueWorkspaceRevisionUpdate(batch, uid);
  await syncMilestonesForGroup(uid, group.id, group.milestones ?? [], { mergeOnly: true }, batch);
  await batch.commit();
  return normalizeWorkspaceRevision(currentWorkspaceRevision) + 1;
};

const updateGroup = async (uid, group, order, previousMilestoneIds, currentWorkspaceRevision = 0) => {
  const batch = writeBatch(db);
  batch.set(getGroupRef(uid, group.id), mapGroupToFirestore(group, order), { merge: true });
  queueWorkspaceRevisionUpdate(batch, uid);
  await syncMilestonesForGroup(uid, group.id, group.milestones ?? [], {
    mergeOnly: false,
    previousMilestoneIds,
  }, batch);
  await batch.commit();
  return normalizeWorkspaceRevision(currentWorkspaceRevision) + 1;
};

const deleteGroup = async (uid, groupId, milestoneIds = null, currentWorkspaceRevision = 0) => {
  const batch = writeBatch(db);

  if (Array.isArray(milestoneIds)) {
    milestoneIds.forEach((milestoneId) => {
      batch.delete(getMilestoneRef(uid, groupId, milestoneId));
    });
  } else {
    const milestonesSnapshot = await getDocs(getMilestonesCollectionRef(uid, groupId));
    milestonesSnapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
  }

  batch.delete(getGroupRef(uid, groupId));
  queueWorkspaceRevisionUpdate(batch, uid);
  await batch.commit();
  return normalizeWorkspaceRevision(currentWorkspaceRevision) + 1;
};

const updateUserMigrationSource = async (uid, source) => {
  await updateDoc(getUserRef(uid), {
    'migration.source': source,
    'migration.importedAt': serverTimestamp(),
    'migration.localStorageImported': true,
  });
};

export const firestoreService = {
  createGroup,
  createTask,
  deleteGroup,
  deleteTask,
  deleteTasksByGroup,
  getUserProfile,
  importLocalData,
  listGroups,
  listTasks,
  loadUserData,
  markMigrationComplete,
  updateGroup,
  updateTask,
  updateUserMigrationSource,
  upsertUserProfile,
};
