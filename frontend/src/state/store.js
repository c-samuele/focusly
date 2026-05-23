// Store globale Zustand.
// Centralizza gruppi, task, selezione corrente, e UI state (sidebar).
import { create } from 'zustand';
import { groupService } from '../services/groupService';
import { taskService } from '../services/taskService';

const SIDEBAR_STORAGE_KEY = 'sidebar-open';

const getInitialSidebarState = () => {
  if (typeof window === 'undefined') {
    return true;
  }
  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return stored === null ? true : stored === 'true';
};

const getInitialState = () => {
  const tasks = taskService.getTasks();
  const groups = groupService.attachStatuses(groupService.getGroups(), tasks);

  // All'avvio leggiamo dallo storage e scegliamo il primo gruppo disponibile.
  return {
    tasks,
    groups,
    selectedGroupId: groups[0]?.id ?? '',
    sidebarOpen: getInitialSidebarState(),
  };
};

const refreshGroups = (groups, tasks) => groupService.attachStatuses(groups, tasks);

export const useAppStore = create((set) => ({
  ...getInitialState(),

  selectGroup: (groupId) => {
    set({ selectedGroupId: groupId, activeTab: 'tasks' });
  },

  createGroup: (groupData) => {
    const groups = groupService.createGroup(groupData);
    set((state) => {
      const nextGroups = refreshGroups(groups, state.tasks);
      // Dopo la creazione selezioniamo automaticamente l'ultimo gruppo aggiunto.
      return {
        groups: nextGroups,
        selectedGroupId: nextGroups[nextGroups.length - 1]?.id || state.selectedGroupId || '',
        activeTab: 'tasks',
      };
    });
  },

  updateGroup: (groupId, updates) => {
    const groups = groupService.updateGroup(groupId, updates);
    set((state) => ({
      groups: refreshGroups(groups, state.tasks),
    }));
  },

  deleteGroup: (groupId) => {
    const tasks = taskService.deleteTasksByGroup(groupId);
    const groups = groupService.deleteGroup(groupId);

    set((state) => {
      const nextGroups = refreshGroups(groups, tasks);
      const nextSelectedGroupId =
        state.selectedGroupId === groupId ? nextGroups[0]?.id ?? '' : state.selectedGroupId;

      return {
        tasks,
        groups: nextGroups,
        selectedGroupId: nextSelectedGroupId,
      };
    });
  },

  createTask: (taskData) => {
    const tasks = taskService.createTask(taskData);
    set((state) => ({
      tasks,
      // Ogni mutazione dei task ricalcola gli status dei gruppi.
      groups: refreshGroups(state.groups, tasks),
      selectedGroupId: state.selectedGroupId || taskData.groupId || '',
    }));
  },

  updateTask: (taskId, updates) => {
    const tasks = taskService.updateTask(taskId, updates);
    set((state) => ({
      tasks,
      groups: refreshGroups(state.groups, tasks),
    }));
  },

  deleteTask: (taskId) => {
    const tasks = taskService.deleteTask(taskId);
    set((state) => ({
      tasks,
      groups: refreshGroups(state.groups, tasks),
    }));
  },

  toggleTaskComplete: (taskId) => {
    const tasks = taskService.toggleTaskComplete(taskId);
    set((state) => ({
      tasks,
      groups: refreshGroups(state.groups, tasks),
    }));
  },

  activeTab: 'analytics',

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  // UI State: Sidebar
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
}));
