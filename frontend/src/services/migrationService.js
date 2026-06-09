import { firestoreService } from './firestoreService';
import { storageService } from './storageService';

const hasImportableLocalData = (appData) => (
  (Array.isArray(appData?.tasks) && appData.tasks.length > 0) ||
  (Array.isArray(appData?.groups) && appData.groups.length > 0)
);

const isLocalSnapshotOwnedByAnotherUser = (uid) => {
  const meta = storageService.getMigrationMeta();
  return Boolean(meta?.uid && meta.uid !== uid);
};

const getLocalSnapshot = () => storageService.getAppData();

const migrateOnFirstLogin = async (uid) => {
  const userProfile = await firestoreService.getUserProfile(uid);

  if (userProfile?.migration?.localStorageImported) {
    return {
      imported: false,
      source: userProfile.migration.source ?? null,
    };
  }

  if (isLocalSnapshotOwnedByAnotherUser(uid)) {
    return {
      imported: false,
      source: 'localStorage-blocked-different-account',
    };
  }

  const appData = getLocalSnapshot();
  await firestoreService.importLocalData(uid, appData, {
    source: 'localStorage',
    mergeOnly: true,
  });
  storageService.setMigrationMeta({
    uid,
    source: 'localStorage',
    updatedAt: new Date().toISOString(),
  });

  return {
    imported: hasImportableLocalData(appData),
    source: 'localStorage',
  };
};

const reimportLocalData = async (uid) => {
  if (isLocalSnapshotOwnedByAnotherUser(uid)) {
    throw new Error('Il backup locale attuale appartiene a un altro account Google e non puo essere reimportato automaticamente.');
  }

  const appData = getLocalSnapshot();

  await firestoreService.importLocalData(uid, appData, {
    source: 'localStorage-manual-merge',
    mergeOnly: true,
  });
  storageService.setMigrationMeta({
    uid,
    source: 'localStorage-manual-merge',
    updatedAt: new Date().toISOString(),
  });

  return {
    imported: hasImportableLocalData(appData),
    source: 'localStorage-manual-merge',
  };
};

export const migrationService = {
  getLocalSnapshot,
  migrateOnFirstLogin,
  reimportLocalData,
};
