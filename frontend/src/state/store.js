// Store globale Zustand.
// Gestisce auth, bootstrap Firestore, migrazione iniziale e CRUD applicativi.
//
// Questo file contiene la regia principale dell'app:
// - ascolta gli eventi Auth
// - decide quando caricare da Firestore o da storage locale
// - coordina groupService, taskService e migrationService
// - mantiene nello stato UI sia la modalita cloud sia quella guest/offline
//
// In termini architetturali, e il punto in cui la business logic del
// prototipo si concentra davvero. I service sottostanti eseguono le singole
// operazioni; lo store decide quando farle e come rifletterle nello stato.
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

// Preferenze di sola UI persistite nel browser.
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

// Stato base riusabile per reset completi o parziali.
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
  isGuestMode: false,
  dataStatus: 'idle',
  migrationStatus: 'idle',
  isSigningIn: false,
  isReimporting: false,
  appError: '',
  migrationSource: null,
});

// Lo stato visuale dei gruppi dipende dai task correnti e quindi viene
// sempre ricalcolato, non letto come fonte di verita dal backend.
const refreshGroups = (groups, tasks) => groupService.attachStatuses(groups, tasks);

// Mantiene una selezione gruppo valida anche quando cambia lo snapshot.
const resolveSelectedGroupId = (groups, currentSelectedGroupId) => {
  if (groups.some((group) => group.id === currentSelectedGroupId)) {
    return currentSelectedGroupId;
  }

  return groups[0]?.id ?? '';
};

// Salvataggio del backup locale associato a un account Google specifico.
// Serve per riaprire il workspace piu velocemente e per supportare il sync.
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

const syncGuestLocalBackup = (tasks, groups, workspaceRevision) => {
  const migrationMeta = storageService.getMigrationMeta();

  // In guest mode il browser diventa la sola fonte disponibile:
  // persistiamo sempre lo snapshot locale senza dipendere da Firebase.
  storageService.setAppData({
    version: 1,
    workspaceRevision,
    tasks,
    groups,
  });

  storageService.setMigrationMeta({
    uid: migrationMeta?.uid ?? null,
    source: 'local-only',
    workspaceRevision,
    updatedAt: new Date().toISOString(),
  });
};

// Restituisce lo snapshot locale solo se appartiene all'utente passato.
// Questo impedisce di bootstrapare nel cloud dati di un altro account.
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

// Normalizza uno snapshot generico in un frammento di stato app utilizzabile.
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

// Persistenza unificata del "working snapshot":
// - se abbiamo un uid, salviamo un backup collegato all'account
// - se siamo guest, salviamo come workspace solo locale
const persistWorkingSnapshot = (uid, tasks, groups, workspaceRevision) => {
  if (uid) {
    syncLocalBackup(uid, tasks, groups, workspaceRevision);
    return;
  }

  syncGuestLocalBackup(tasks, groups, workspaceRevision);
};

// Legge lo snapshot guest dal browser e lo adatta allo stato UI.
const getGuestStateFromLocalSnapshot = (currentSelectedGroupId = '') => {
  const localSnapshot = storageService.getAppData();
  return buildStateFromSnapshot(localSnapshot, currentSelectedGroupId);
};

// Caricamento remoto completo del workspace da Firestore.
// Lo usiamo nel bootstrap e nei refresh manuali.
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

  // Gestore centrale degli eventi Auth.
  // Viene invocato ogni volta che Firebase segnala login/logout/ripristino.
  handleAuthStateChange: async (user) => {
    if (!user) {
      // Se siamo gia in guest mode non vogliamo che un evento `null`
      // di Auth ci butti fuori dal workspace locale.
      if (get().authStatus === 'guest') {
        return;
      }

      authBootstrapState.uid = '';
      authBootstrapState.promise = null;
      set((state) => ({
        ...getBaseState(),
        sidebarOpen: state.sidebarOpen,
        statsPeriod: state.statsPeriod,
        authStatus: 'unauthenticated',
        isGuestMode: false,
      }));
      return;
    }

    if (authBootstrapState.promise && authBootstrapState.uid === user.uid) {
      // Evita bootstrap duplicati per lo stesso utente quando il listener
      // Auth emette piu eventi ravvicinati.
      await authBootstrapState.promise;
      return;
    }

    const bootstrapPromise = (async () => {
      set({
        authUser: user,
        authStatus: 'authenticated',
        isGuestMode: false,
        dataStatus: 'loading',
        migrationStatus: 'idle',
        appError: '',
      });

      try {
        // 1. Allineiamo/creiamo il profilo utente su Firestore.
        const userProfile = await firestoreService.upsertUserProfile(user);
        const shouldForceRemoteBootstrap = !userProfile.migration?.localStorageImported;

        // 2. Se serve, importiamo nel cloud il backup locale preesistente.
        set({ migrationStatus: 'running' });
        const migrationResult = await migrationService.migrateOnFirstLogin(user.uid, userProfile);

        // 3. Se il backup locale appartiene allo stesso utente e la revisione
        // coincide, possiamo bootstrapare da cache invece che dal cloud.
        const localSnapshot = shouldForceRemoteBootstrap ? null : getOwnedLocalSnapshot(user.uid);
        const canBootstrapFromCache = (
          localSnapshot &&
          localSnapshot.workspaceRevision === userProfile.workspaceRevision
        );

        // 4. Costruiamo lo stato dall'origine piu adatta.
        const nextState = canBootstrapFromCache
          ? buildStateFromSnapshot(localSnapshot, get().selectedGroupId)
          : await loadRemoteState(user.uid, get().selectedGroupId);

        // 5. Se siamo passati dal cloud, aggiorniamo il backup locale.
        if (!canBootstrapFromCache) {
          syncLocalBackup(user.uid, nextState.tasks, nextState.groups, nextState.workspaceRevision);
        }

        set({
          authUser: user,
          authStatus: 'authenticated',
          isGuestMode: false,
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

  // Ingresso esplicito nel workspace locale senza account cloud.
  enterGuestMode: () => {
    const nextState = getGuestStateFromLocalSnapshot(get().selectedGroupId);
    const migrationMeta = storageService.getMigrationMeta();

    // L'accesso guest riapre il workspace a partire dal browser:
    // niente cloud, ma lettura e modifica locali complete.
    set((state) => ({
      ...state,
      authUser: null,
      authStatus: 'guest',
      isGuestMode: true,
      dataStatus: 'ready',
      migrationStatus: 'idle',
      migrationSource: migrationMeta?.source ?? 'local-only',
      tasks: nextState.tasks,
      groups: nextState.groups,
      workspaceRevision: nextState.workspaceRevision,
      selectedGroupId: nextState.selectedGroupId,
      appError: '',
    }));
  },

  // Avvia il login Google. Il vero bootstrap dati avverra poi
  // nel listener `handleAuthStateChange`.
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

  // In cloud mode effettua il logout Firebase.
  // In guest mode esegue solo un reset locale della shell di accesso.
  signOut: async () => {
    if (get().isGuestMode) {
      set((state) => ({
        ...getBaseState(),
        sidebarOpen: state.sidebarOpen,
        statsPeriod: state.statsPeriod,
        authStatus: 'unauthenticated',
        appError: '',
      }));
      return;
    }

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

  // Rilettura manuale dello snapshot remoto da Firestore.
  refreshRemoteData: async () => {
    const { authUser, selectedGroupId } = get();
    if (!authUser) {
      set({
        appError: 'Accedi con Google per aggiornare il workspace cloud.',
      });
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

  // Riusa il comando di sync esistente: push manuale del locale verso Firestore,
  // seguito da una rilettura remota per riallineare lo store.
  reimportLocalData: async () => {
    const { authUser, selectedGroupId } = get();
    if (!authUser) {
      set({
        appError: 'Accedi con Google per sincronizzare i dati locali con Firestore.',
      });
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

  // Mutazioni di sola navigazione/UI.
  selectGroup: (groupId) => {
    set({ selectedGroupId: groupId, activeTab: 'tasks' });
  },

  // CRUD gruppi -----------------------------------------------------------
  //
  // Tutte queste azioni:
  // - delegano la mutazione a `groupService`
  // - ricalcolano lo stato derivato
  // - persistono lo snapshot risultante in cloud backup o guest local
  createGroup: async (groupData) => {
    const { authUser, tasks, groups, workspaceRevision } = get();
    const uid = authUser?.uid ?? null;

    try {
      const nextGroupState = await groupService.createGroup(
        uid,
        groupData,
        groups,
        workspaceRevision
      );

      set((state) => {
        const nextGroups = refreshGroups(nextGroupState.groups, tasks);
        persistWorkingSnapshot(uid, tasks, nextGroups, nextGroupState.workspaceRevision);
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
    const uid = authUser?.uid ?? null;

    try {
      const nextGroupState = await groupService.updateGroup(
        uid,
        groupId,
        updates,
        groups,
        workspaceRevision
      );

      set(() => ({
        groups: (() => {
          const nextGroups = refreshGroups(nextGroupState.groups, tasks);
          persistWorkingSnapshot(uid, tasks, nextGroups, nextGroupState.workspaceRevision);
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
    const uid = authUser?.uid ?? null;

    try {
      const nextTaskState = await taskService.deleteTasksByGroup(
        uid,
        groupId,
        currentTasks,
        workspaceRevision
      );
      const nextGroupState = await groupService.deleteGroup(
        uid,
        groupId,
        currentGroups,
        nextTaskState.workspaceRevision
      );

      set((state) => {
        const nextGroups = refreshGroups(nextGroupState.groups, nextTaskState.tasks);
        persistWorkingSnapshot(
          uid,
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
    const uid = authUser?.uid ?? null;
    if (!Array.isArray(nextGroups) || nextGroups.length === 0) {
      return;
    }

    try {
      const nextGroupState = await groupService.reorderGroups(
        uid,
        nextGroups,
        workspaceRevision
      );

      set((state) => {
        const refreshedGroups = refreshGroups(nextGroupState.groups, tasks);
        persistWorkingSnapshot(uid, tasks, refreshedGroups, nextGroupState.workspaceRevision);

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

  // CRUD task -------------------------------------------------------------
  //
  // Stesso pattern dei gruppi: mutazione delegata, aggiornamento store,
  // persistenza dello snapshot di lavoro.
  createTask: async (taskData) => {
    const { authUser, tasks: currentTasks, workspaceRevision } = get();
    const uid = authUser?.uid ?? null;

    try {
      const nextTaskState = await taskService.createTask(
        uid,
        taskData,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          persistWorkingSnapshot(uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
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
    const uid = authUser?.uid ?? null;

    try {
      const nextTaskState = await taskService.updateTask(
        uid,
        taskId,
        updates,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          persistWorkingSnapshot(uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
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
    const uid = authUser?.uid ?? null;

    try {
      const nextTaskState = await taskService.deleteTask(
        uid,
        taskId,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          persistWorkingSnapshot(uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
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
    const uid = authUser?.uid ?? null;

    try {
      const nextTaskState = await taskService.toggleTaskComplete(
        uid,
        taskId,
        currentTasks,
        workspaceRevision
      );

      set((state) => ({
        tasks: nextTaskState.tasks,
        groups: (() => {
          const nextGroups = refreshGroups(state.groups, nextTaskState.tasks);
          persistWorkingSnapshot(uid, nextTaskState.tasks, nextGroups, nextTaskState.workspaceRevision);
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

  // Helpers di sola interfaccia persistiti nel browser.
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
