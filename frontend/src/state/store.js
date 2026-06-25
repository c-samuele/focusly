// Store globale Zustand.
// Gestisce auth, bootstrap Firestore, migrazione iniziale e CRUD applicativi.
import { create } from 'zustand';
import { authService } from '../services/authService';
import { firestoreService } from '../services/firestoreService';
import { groupService } from '../services/groupService';
import { migrationService } from '../services/migrationService';
import { storageService } from '../services/storageService';
import { taskService } from '../services/taskService';

const SIDEBAR_STORAGE_KEY = 'sidebar-open';
const STATS_PERIOD_STORAGE_KEY = 'analytics-stats-period';
const VALID_STATS_PERIODS = new Set(['day', 'week', 'month', 'year']);
const authBootstrapState = {
  uid: '',
  promise: null,
};

const getInitialSidebarState = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
};

const getInitialStatsPeriod = () => {
  if (typeof window === 'undefined') {
    return 'week';
  }

  const stored = window.localStorage.getItem(STATS_PERIOD_STORAGE_KEY);
  return VALID_STATS_PERIODS.has(stored) ? stored : 'week';
};

const getBaseState = () => ({
  tasks: [],
  groups: [],
  workspaceRevision: 0,
  selectedGroupId: '',
  sidebarOpen: getInitialSidebarState(),
  statsPeriod: getInitialStatsPeriod(),
  activeTab: 'analytics',
  authUser: null,
  authStatus: 'loading',
  dataStatus: 'idle',
  migrationStatus: 'idle',
  isSigningIn: false,
  isReimporting: false,
  appError: '',
  migrationSource: null,
});

const refreshGroups = (groups, tasks) => groupService.attachStatuses(groups, tasks);

const resolveSelectedGroupId = (groups, currentSelectedGroupId) => {
  if (groups.some((group) => group.id === currentSelectedGroupId)) {
    return currentSelectedGroupId;
  }

  return groups[0]?.id ?? '';
};

const syncLocalBackup = (uid, tasks, groups, workspaceRevision) => {
  const migrationMeta = storageService.getMigrationMeta();

  if (migrationMeta?.uid && migrationMeta.uid !== uid) {
    return;
  }

  storageService.setAppData({
    version: 1,
    workspaceRevision,
    tasks,
    groups,
  });

  storageService.setMigrationMeta({
    uid,
    source: migrationMeta?.source ?? 'firestore-sync',
    workspaceRevision,
    updatedAt: new Date().toISOString(),
  });
};

const getOwnedLocalSnapshot = (uid) => {
  const migrationMeta = storageService.getMigrationMeta();

  if (!migrationMeta?.uid || migrationMeta.uid !== uid) {
    return null;
  }

  const appData = storageService.getAppData();
  const workspaceRevision = Number.isFinite(Number(migrationMeta.workspaceRevision))
    ? Number(migrationMeta.workspaceRevision)
    : Number.isFinite(Number(appData.workspaceRevision))
      ? Number(appData.workspaceRevision)
      : 0;

  return {
    ...appData,
    workspaceRevision,
  };
};

const buildStateFromSnapshot = (snapshot, currentSelectedGroupId = '') => {
  const tasks = Array.isArray(snapshot?.tasks) ? snapshot.tasks : [];
  const groups = refreshGroups(Array.isArray(snapshot?.groups) ? snapshot.groups : [], tasks);

  return {
    tasks,
    groups,
    workspaceRevision: Number.isFinite(Number(snapshot?.workspaceRevision))
      ? Number(snapshot.workspaceRevision)
      : 0,
    selectedGroupId: resolveSelectedGroupId(groups, currentSelectedGroupId),
  };
};

const loadRemoteState = async (uid, currentSelectedGroupId = '', userProfile = null) => {
  const { userProfile: resolvedUserProfile, tasks, groups } = await firestoreService.loadUserData(uid, userProfile);
  const nextGroups = refreshGroups(groups, tasks);

  return {
    tasks,
    groups: nextGroups,
    userProfile: resolvedUserProfile,
    workspaceRevision: resolvedUserProfile?.workspaceRevision ?? 0,
    selectedGroupId: resolveSelectedGroupId(nextGroups, currentSelectedGroupId),
  };
};

export const useAppStore = create((set, get) => ({
  ...getBaseState(),

  handleAuthStateChange: async (user) => {
    if (!user) {
      authBootstrapState.uid = '';
      authBootstrapState.promise = null;
      set((state) => ({
        ...getBaseState(),
        sidebarOpen: state.sidebarOpen,
        statsPeriod: state.statsPeriod,
        authStatus: 'unauthenticated',
      }));
      return;
    }

    if (authBootstrapState.promise && authBootstrapState.uid === user.uid) {
      await authBootstrapState.promise;
      return;
    }

    const bootstrapPromise = (async () => {
      set({
        authUser: user,
        authStatus: 'authenticated',
        dataStatus: 'loading',
        migrationStatus: 'idle',
        appError: '',
      });

      try {
        const userProfile = await firestoreService.upsertUserProfile(user);
        const shouldForceRemoteBootstrap = !userProfile.migration?.localStorageImported;

        set({ migrationStatus: 'running' });
        const migrationResult = await migrationService.migrateOnFirstLogin(user.uid, userProfile);
        const localSnapshot = shouldForceRemoteBootstrap ? null : getOwnedLocalSnapshot(user.uid);
        const canBootstrapFromCache = (
          localSnapshot &&
          localSnapshot.workspaceRevision === userProfile.workspaceRevision
        );

        const nextState = canBootstrapFromCache
          ? buildStateFromSnapshot(localSnapshot, get().selectedGroupId)
          : await loadRemoteState(user.uid, get().selectedGroupId);

        if (!canBootstrapFromCache) {
          syncLocalBackup(user.uid, nextState.tasks, nextState.groups, nextState.workspaceRevision);
        }

        set({
          authUser: user,
          authStatus: 'authenticated',
          dataStatus: 'ready',
          migrationStatus: 'completed',
          migrationSource: migrationResult.source,
          tasks: nextState.tasks,
          groups: nextState.groups,
          workspaceRevision: nextState.workspaceRevision,
          selectedGroupId: nextState.selectedGroupId,
          appError: '',
        });
      } catch (error) {
        console.error('Failed to bootstrap app data', error);
        set({
          dataStatus: 'error',
          migrationStatus: 'error',
          appError: error instanceof Error ? error.message : 'Bootstrap failed',
        });
      } finally {
        if (authBootstrapState.promise === bootstrapPromise) {
          authBootstrapState.uid = '';
          authBootstrapState.promise = null;
        }
      }
    })();

    authBootstrapState.uid = user.uid;
    authBootstrapState.promise = bootstrapPromise;
    await bootstrapPromise;
  },

  signInWithGoogle: async () => {
    set({ isSigningIn: true, appError: '' });

    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Google sign-in failed',
      });
    } finally {
      set({ isSigningIn: false });
    }
  },

  signOut: async () => {
    set({ appError: '' });

    try {
      await authService.signOutUser();
    } catch (error) {
      console.error('Sign out failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Sign out failed',
      });
    }
  },

  refreshRemoteData: async () => {
    const { authUser, selectedGroupId } = get();
    if (!authUser) {
      return;
    }

    set({ dataStatus: 'loading', appError: '' });

    try {
      const remoteState = await loadRemoteState(authUser.uid, selectedGroupId);
      syncLocalBackup(authUser.uid, remoteState.tasks, remoteState.groups, remoteState.workspaceRevision);
      set({
        dataStatus: 'ready',
        tasks: remoteState.tasks,
        groups: remoteState.groups,
        workspaceRevision: remoteState.workspaceRevision,
        selectedGroupId: remoteState.selectedGroupId,
      });
    } catch (error) {
      console.error('Failed to refresh remote data', error);
      set({
        dataStatus: 'error',
        appError: error instanceof Error ? error.message : 'Refresh failed',
      });
    }
  },

  reimportLocalData: async () => {
    const { authUser, selectedGroupId } = get();
    if (!authUser) {
      return;
    }

    set({ isReimporting: true, appError: '' });

    try {
      const migrationResult = await migrationService.reimportLocalData(authUser.uid);
      const remoteState = await loadRemoteState(authUser.uid, selectedGroupId);
      syncLocalBackup(authUser.uid, remoteState.tasks, remoteState.groups, remoteState.workspaceRevision);

      set({
        isReimporting: false,
        migrationStatus: 'completed',
        migrationSource: migrationResult.source,
        tasks: remoteState.tasks,
        groups: remoteState.groups,
        workspaceRevision: remoteState.workspaceRevision,
        selectedGroupId: remoteState.selectedGroupId,
      });
    } catch (error) {
      console.error('Local reimport failed', error);
      set({
        isReimporting: false,
        appError: error instanceof Error ? error.message : 'Reimport failed',
      });
    }
  },

  selectGroup: (groupId) => {
    set({ selectedGroupId: groupId, activeTab: 'tasks' });
  },

  createGroup: async (groupData) => {
    const { authUser, tasks, groups, workspaceRevision } = get();
    if (!authUser) {
      return;
    }

    try {
      const nextGroupState = await groupService.createGroup(
        authUser.uid,
        groupData,
        groups,
        workspaceRevision
      );

      set((state) => {
        const nextGroups = refreshGroups(nextGroupState.groups, tasks);
        syncLocalBackup(authUser.uid, tasks, nextGroups, nextGroupState.workspaceRevision);
        return {
          groups: nextGroups,
          workspaceRevision: nextGroupState.workspaceRevision,
          selectedGroupId: nextGroups[nextGroups.length - 1]?.id || state.selectedGroupId || '',
          activeTab: 'tasks',
          appError: '',
        };
      });
    } catch (error) {
      console.error('Create group failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Create group failed',
      });
    }
  },

  updateGroup: async (groupId, updates) => {
    const { authUser, tasks, groups, workspaceRevision } = get();
    if (!authUser) {
      return;
    }

    try {
      const nextGroupState = await groupService.updateGroup(
        authUser.uid,
        groupId,
        updates,
        groups,
        workspaceRevision
      );

      set(() => ({
        groups: (() => {
          const nextGroups = refreshGroups(nextGroupState.groups, tasks);
          syncLocalBackup(authUser.uid, tasks, nextGroups, nextGroupState.workspaceRevision);
          return nextGroups;
        })(),
        workspaceRevision: nextGroupState.workspaceRevision,
        appError: '',
      }));
    } catch (error) {
      console.error('Update group failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Update group failed',
      });
    }
  },

  deleteGroup: async (groupId) => {
    const {
      authUser,
      tasks: currentTasks,
      groups: currentGroups,
      workspaceRevision,
    } = get();
    if (!authUser) {
      return;
    }

    try {
      const nextTaskState = await taskService.deleteTasksByGroup(
        authUser.uid,
        groupId,
        currentTasks,
        workspaceRevision
      );
      const nextGroupState = await groupService.deleteGroup(
        authUser.uid,
        groupId,
        currentGroups,
        nextTaskState.workspaceRevision
      );

      set((state) => {
        const nextGroups = refreshGroups(nextGroupState.groups, nextTaskState.tasks);
        syncLocalBackup(
          authUser.uid,
          nextTaskState.tasks,
          nextGroups,
          nextGroupState.workspaceRevision
        );
        const nextSelectedGroupId =
          state.selectedGroupId === groupId ? nextGroups[0]?.id ?? '' : state.selectedGroupId;

        return {
          tasks: nextTaskState.tasks,
          groups: nextGroups,
          workspaceRevision: nextGroupState.workspaceRevision,
          selectedGroupId: nextSelectedGroupId,
          appError: '',
        };
      });
    } catch (error) {
      console.error('Delete group failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Delete group failed',
      });
    }
  },

  reorderGroups: async (nextGroups) => {
    const { authUser, tasks, workspaceRevision } = get();
    if (!authUser || !Array.isArray(nextGroups) || nextGroups.length === 0) {
      return;
    }

    try {
      const nextGroupState = await groupService.reorderGroups(
        authUser.uid,
        nextGroups,
        workspaceRevision
      );

      set((state) => {
        const refreshedGroups = refreshGroups(nextGroupState.groups, tasks);
        syncLocalBackup(authUser.uid, tasks, refreshedGroups, nextGroupState.workspaceRevision);

        return {
          groups: refreshedGroups,
          workspaceRevision: nextGroupState.workspaceRevision,
          selectedGroupId: state.selectedGroupId,
          appError: '',
        };
      });
    } catch (error) {
      console.error('Reorder groups failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Reorder groups failed',
      });
    }
  },

  createTask: async (taskData) => {
    const { authUser, tasks: currentTasks, workspaceRevision } = get();
    if (!authUser) {
      return;
    }

    try {
      const nextTaskState = await taskService.createTask(
        authUser.uid,
        taskData,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          syncLocalBackup(authUser.uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
          return nextGroups;
        })(),
        workspaceRevision: nextTaskState.workspaceRevision,
        selectedGroupId: state.selectedGroupId || taskData.groupId || '',
        appError: '',
      }));
    } catch (error) {
      console.error('Create task failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Create task failed',
      });
    }
  },

  updateTask: async (taskId, updates) => {
    const { authUser, tasks: currentTasks, workspaceRevision } = get();
    if (!authUser) {
      return;
    }

    try {
      const nextTaskState = await taskService.updateTask(
        authUser.uid,
        taskId,
        updates,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          syncLocalBackup(authUser.uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
          return nextGroups;
        })(),
        workspaceRevision: nextTaskState.workspaceRevision,
        appError: '',
      }));
    } catch (error) {
      console.error('Update task failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Update task failed',
      });
    }
  },

  deleteTask: async (taskId) => {
    const { authUser, tasks: currentTasks, workspaceRevision } = get();
    if (!authUser) {
      return;
    }

    try {
      const nextTaskState = await taskService.deleteTask(
        authUser.uid,
        taskId,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          syncLocalBackup(authUser.uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
          return nextGroups;
        })(),
        workspaceRevision: nextTaskState.workspaceRevision,
        appError: '',
      }));
    } catch (error) {
      console.error('Delete task failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Delete task failed',
      });
    }
  },

  toggleTaskComplete: async (taskId) => {
    const { authUser, tasks: currentTasks, workspaceRevision } = get();
    if (!authUser) {
      return;
    }

    try {
      const nextTaskState = await taskService.toggleTaskComplete(
        authUser.uid,
        taskId,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          syncLocalBackup(authUser.uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
          return nextGroups;
        })(),
        workspaceRevision: nextTaskState.workspaceRevision,
        appError: '',
      }));
    } catch (error) {
      console.error('Toggle task failed', error);
      set({
        appError: error instanceof Error ? error.message : 'Toggle task failed',
      });
    }
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  toggleSidebar: () => {
    set((state) => {
      const newSidebarState = !state.sidebarOpen;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newSidebarState));
      }
      return { sidebarOpen: newSidebarState };
    });
  },

  setSidebarOpen: (isOpen) => {
    set(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isOpen));
      }
      return { sidebarOpen: isOpen };
    });
  },

  setStatsPeriod: (period) => {
    if (!VALID_STATS_PERIODS.has(period)) {
      return;
    }

    set(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STATS_PERIOD_STORAGE_KEY, period);
      }

      return { statsPeriod: period };
    });
  },
}));
