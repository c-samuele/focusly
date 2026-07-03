// Service di migrazione tra persistenza locale del browser e Firestore.
//
// Questo modulo non gestisce direttamente l'autenticazione o le query:
// coordina il passaggio dei dati locali verso il backend Firebase,
// appoggiandosi a:
// - `storageService` per leggere lo snapshot del browser
// - `firestoreService` per importarlo nel cloud
//
// In pratica e il ponte logico dietro al comando di sync/import.
import { firestoreService } from './firestoreService';
import { storageService } from './storageService';

// Dice se nel browser esiste davvero qualcosa di importabile.
const hasImportableLocalData = (appData) => (
  (Array.isArray(appData?.tasks) && appData.tasks.length > 0) ||
  (Array.isArray(appData?.groups) && appData.groups.length > 0)
);

// Evita che dati locali appartenenti a un account precedente
// vengano spinti automaticamente sul cloud di un altro utente.
const isLocalSnapshotOwnedByAnotherUser = (uid) => {
  const meta = storageService.getMigrationMeta();
  return Boolean(meta?.uid && meta.uid !== uid);
};

// Lettura comoda dello snapshot locale unificato dell'app.
const getLocalSnapshot = () => storageService.getAppData();

// Migrazione automatica eseguita al primo login utile.
// Se il profilo cloud dice che la migrazione e gia stata fatta,
// il metodo diventa di fatto un no-op.
const migrateOnFirstLogin = async (uid, existingUserProfile = null) => {
  const userProfile = existingUserProfile ?? await firestoreService.getUserProfile(uid);

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

// Reimport manuale richiesto esplicitamente dall'utente.
// Riusa l'import Firestore, ma con una `source` diversa per tenere traccia
// del fatto che l'operazione e stata lanciata dalla UI di sync.
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

// API pubblica del service di migrazione.
export const migrationService = {
  getLocalSnapshot,
  migrateOnFirstLogin,
  reimportLocalData,
};
