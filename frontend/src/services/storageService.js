// Servizio di persistenza locale.
// Gestisce backup locale, migrazione legacy e metadati per la migrazione Firebase.
const APP_STORAGE_KEY = 'studyPlannerData';
const MIGRATION_META_KEY = 'studyPlannerMigrationMeta';
const LEGACY_TASKS_KEY = 'tasks';
const LEGACY_GROUPS_KEY = 'groups';
const isBrowser = typeof window !== 'undefined';
const DEFAULT_GROUP_ID = 'group-inbox';

const createEmptyData = () => ({
  version: 1,
  tasks: [],
  groups: [],
});

const safeParse = (value, fallback) => {
  try {
    const parsedValue = JSON.parse(value);
    return parsedValue ?? fallback;
  } catch (error) {
    return fallback;
  }
};

const readLegacyCollections = () => {
  const tasks = safeParse(window.localStorage.getItem(LEGACY_TASKS_KEY), []);
  const groups = safeParse(window.localStorage.getItem(LEGACY_GROUPS_KEY), []);

  return {
    version: 1,
    tasks: Array.isArray(tasks) ? tasks : [],
    groups: Array.isArray(groups) ? groups : [],
  };
};

const normalizeDataShape = (data) => {
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const orphanTasks = tasks.filter((task) => !task.groupId);

  // Se esistono task senza gruppo li assegnamo a un gruppo Inbox
  // così lo stato dell'app rimane coerente anche con dati vecchi o incompleti.
  if (!orphanTasks.length) {
    return {
      version: 1,
      tasks,
      groups,
    };
  }

  const hasInboxGroup = groups.some((group) => group.id === DEFAULT_GROUP_ID);
  const nextGroups = hasInboxGroup
    ? groups
    : [
        ...groups,
        {
          id: DEFAULT_GROUP_ID,
          name: 'Inbox',
          status: 'inactive',
        },
      ];

  const nextTasks = tasks.map((task) =>
    task.groupId
      ? task
      : {
          ...task,
          groupId: DEFAULT_GROUP_ID,
        }
  );

  return {
    version: 1,
    tasks: nextTasks,
    groups: nextGroups,
  };
};

const getAppData = () => {
  if (!isBrowser) {
    return createEmptyData();
  }

  // Prima proviamo il nuovo storage unificato.
  const rawValue = window.localStorage.getItem(APP_STORAGE_KEY);

  if (rawValue) {
    const parsedValue = safeParse(rawValue, createEmptyData());
    return normalizeDataShape(parsedValue);
  }

  // In assenza del nuovo formato proviamo a migrare i dati legacy.
  const legacyData = normalizeDataShape(readLegacyCollections());

  if (legacyData.tasks.length || legacyData.groups.length) {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(legacyData));
  }

  return legacyData;
};

const setAppData = (data) => {
  if (!isBrowser) {
    return createEmptyData();
  }

  // Ogni scrittura ripassa dalla normalizzazione per evitare shape inconsistenti.
  const nextData = {
    ...normalizeDataShape(data),
  };

  try {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(nextData));
    return nextData;
  } catch (error) {
    console.error('Failed to save study planner data', error);
    return getAppData();
  }
};

const updateAppData = (updater) => {
  const currentData = getAppData();
  const updatedData = updater(currentData);
  return setAppData(updatedData);
};

const getMigrationMeta = () => {
  if (!isBrowser) {
    return null;
  }

  return safeParse(window.localStorage.getItem(MIGRATION_META_KEY), null);
};

const setMigrationMeta = (meta) => {
  if (!isBrowser) {
    return null;
  }

  try {
    window.localStorage.setItem(MIGRATION_META_KEY, JSON.stringify(meta));
    return meta;
  } catch (error) {
    console.error('Failed to save migration metadata', error);
    return getMigrationMeta();
  }
};

export const storageService = {
  getAppData,
  getMigrationMeta,
  setAppData,
  setMigrationMeta,
  updateAppData,
};
