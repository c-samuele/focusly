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

const syncLocalBackup = (uid, tasks, groups) => {
  const migrationMeta = storageService.getMigrationMeta();

  if (migrationMeta?.uid && migrationMeta.uid !== uid) {
    return;
  }

  storageService.setAppData({
    version: 1,
    tasks,
    groups,
  });

  storageService.setMigrationMeta({
    uid,
    source: migrationMeta?.source ?? 'firestore-sync',
    updatedAt: new Date().toISOString(),
  });
};

const loadRemoteState = async (uid, currentSelectedGroupId = '') => {
  const { userProfile, tasks, groups } = await firestoreService.loadUserData(uid);
  const nextGroups = refreshGroups(groups, tasks);

  return {
    tasks,
    groups: nextGroups,
    userProfile,
    selectedGroupId: resolveSelectedGroupId(nextGroups, currentSelectedGroupId),
  };
};

export const useAppStore = create((set, get) => ({
  ...getBaseState(),

  handleAuthStateChange: async (user) => {
    if (!user) {
      set((state) => ({
        ...getBaseState(),
        sidebarOpen: state.sidebarOpen,
        statsPeriod: state.statsPeriod,
        authStatus: 'unauthenticated',
      }));
      return;
    }

    set({
      authUser: user,
      authStatus: 'authenticated',
      dataStatus: 'loading',
      migrationStatus: 'idle',
      appError: '',
    });

    try {
      await firestoreService.upsertUserProfile(user);

      set({ migrationStatus: 'running' });
      const migrationResult = await migrationService.migrateOnFirstLogin(user.uid);
      const remoteState = await loadRemoteState(user.uid, get().selectedGroupId);
      syncLocalBackup(user.uid, remoteState.tasks, remoteState.groups);

      set({
        authUser: user,
        authStatus: 'authenticated',
        dataStatus: 'ready',
        migrationStatus: 'completed',
        migrationSource: migrationResult.source,
        tasks: remoteState.tasks,
        groups: remoteState.groups,
        selectedGroupId: remoteState.selectedGroupId,
        appError: '',
      });
    } catch (error) {
      console.error('Failed to bootstrap app data', error);
      set({
        dataStatus: 'error',
        migrationStatus: 'error',
        appError: error instanceof Error ? error.message : 'Bootstrap failed',
      });
    }
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
      syncLocalBackup(authUser.uid, remoteState.tasks, remoteState.groups);
      set({
        dataStatus: 'ready',
        tasks: remoteState.tasks,
        groups: remoteState.groups,
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
      syncLocalBackup(authUser.uid, remoteState.tasks, remoteState.groups);

      set({
        isReimporting: false,
        migrationStatus: 'completed',
        migrationSource: migrationResult.source,
        tasks: remoteState.tasks,
        groups: remoteState.groups,
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
    const { authUser, tasks } = get();
    if (!authUser) {
      return;
    }

    try {
      const groups = await groupService.createGroup(authUser.uid, groupData);
      set((state) => {
        const nextGroups = refreshGroups(groups, tasks);
        syncLocalBackup(authUser.uid, tasks, nextGroups);
        return {
          groups: nextGroups,
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
    const { authUser, tasks } = get();
    if (!authUser) {
      return;
    }

    try {
      const groups = await groupService.updateGroup(authUser.uid, groupId, updates);
      set(() => ({
        groups: (() => {
          const nextGroups = refreshGroups(groups, tasks);
          syncLocalBackup(authUser.uid, tasks, nextGroups);
          return nextGroups;
        })(),
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
    const { authUser } = get();
    if (!authUser) {
      return;
    }

    try {
      const tasks = await taskService.deleteTasksByGroup(authUser.uid, groupId);
      const groups = await groupService.deleteGroup(authUser.uid, groupId);

      set((state) => {
        const nextGroups = refreshGroups(groups, tasks);
        syncLocalBackup(authUser.uid, tasks, nextGroups);
        const nextSelectedGroupId =
          state.selectedGroupId === groupId ? nextGroups[0]?.id ?? '' : state.selectedGroupId;

        return {
          tasks,
          groups: nextGroups,
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

  createTask: async (taskData) => {
    const { authUser } = get();
    if (!authUser) {
      return;
    }

    try {
      const tasks = await taskService.createTask(authUser.uid, taskData);
      set((state) => ({
        tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, tasks);
          syncLocalBackup(authUser.uid, tasks, nextGroups);
          return nextGroups;
        })(),
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
    const { authUser } = get();
    if (!authUser) {
      return;
    }

    try {
      const tasks = await taskService.updateTask(authUser.uid, taskId, updates);
      set((state) => ({
        tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, tasks);
          syncLocalBackup(authUser.uid, tasks, nextGroups);
          return nextGroups;
        })(),
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
    const { authUser } = get();
    if (!authUser) {
      return;
    }

    try {
      const tasks = await taskService.deleteTask(authUser.uid, taskId);
      set((state) => ({
        tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, tasks);
          syncLocalBackup(authUser.uid, tasks, nextGroups);
          return nextGroups;
        })(),
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
    const { authUser } = get();
    if (!authUser) {
      return;
    }

    try {
      const tasks = await taskService.toggleTaskComplete(authUser.uid, taskId);
      set((state) => ({
        tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, tasks);
          syncLocalBackup(authUser.uid, tasks, nextGroups);
          return nextGroups;
        })(),
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
