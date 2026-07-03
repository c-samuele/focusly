// Componente radice dell'applicazione.
// Gestisce bootstrap auth + dati prima di mostrare la dashboard.
//
// Questo e il primo anello applicativo del collegamento con Firebase:
// - applica il tema iniziale
// - si sottoscrive allo stato Auth tramite `authService`
// - decide quale shell mostrare in base allo stato auth/dati
//
// Non fa query Firestore in proprio, ma apre il flusso che porta lo store
// a farle quando arriva un utente autenticato.
import { useEffect } from 'react';
import SignInScreen from './components/Auth/SignInScreen';
import BootstrapScreen from './components/UI/BootstrapScreen';
import Dashboard from './pages/Dashboard';
import { authService } from './services/authService';
import { useAppStore } from './state/store';
import { applyThemeToDocument, getInitialTheme } from './utils/themePreferences';

function App() {
  const authStatus = useAppStore((state) => state.authStatus);
  const dataStatus = useAppStore((state) => state.dataStatus);
  const migrationStatus = useAppStore((state) => state.migrationStatus);
  const appError = useAppStore((state) => state.appError);
  const isSigningIn = useAppStore((state) => state.isSigningIn);
  const enterGuestMode = useAppStore((state) => state.enterGuestMode);
  const handleAuthStateChange = useAppStore((state) => state.handleAuthStateChange);
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle);

  useEffect(() => {
    // Manteniamo tema e meta colore coerenti gia dal bootstrap iniziale,
    // anche prima che la dashboard sia pronta.
    applyThemeToDocument(getInitialTheme());
  }, []);

  useEffect(() => {
    // Subscription alla sessione Firebase Auth.
    // Quando lo stato auth cambia, deleghiamo allo store il bootstrap
    // del workspace remoto o locale.
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      handleAuthStateChange(user);
    });

    return () => unsubscribe();
  }, [handleAuthStateChange]);

  if (authStatus === 'loading') {
    // Fase iniziale: stiamo ancora aspettando che Firebase Auth dica
    // se esiste gia una sessione valida nel browser.
    return (
      <BootstrapScreen
        eyebrow="Launch"
        title="Preparing Focusly"
        status="Checking session"
        detail="Starting secure sync"
      />
    );
  }

  if (authStatus === 'unauthenticated') {
    // Nessuna sessione cloud disponibile:
    // l'utente puo fare login Google oppure aprire la modalita guest/offline.
    return (
      <SignInScreen
        onSignIn={signInWithGoogle}
        onEnterOffline={enterGuestMode}
        isSigningIn={isSigningIn}
        errorMessage={appError}
      />
    );
  }

  if (dataStatus === 'loading') {
    // L'utente e autenticato, ma lo store sta ancora costruendo
    // lo snapshot applicativo da cloud o migrazione locale.
    return (
      <BootstrapScreen
        eyebrow={migrationStatus === 'running' ? 'Import' : 'Sync'}
        title={migrationStatus === 'running' ? 'Importing your backup' : 'Loading your workspace'}
        status={migrationStatus === 'running' ? 'Merging local data' : 'Fetching cloud data'}
        detail={migrationStatus === 'running' ? 'Almost ready' : 'Building focus view'}
      />
    );
  }

  if (dataStatus === 'error') {
    // Se il bootstrap cloud fallisce, restiamo su una schermata controllata
    // che permette sia retry via login sia ingresso offline dal browser.
    return (
      <SignInScreen
        onSignIn={signInWithGoogle}
        onEnterOffline={enterGuestMode}
        isSigningIn={isSigningIn}
        errorMessage={appError || 'Check Firebase config, rules and env vars.'}
        title="Cloud workspace temporarily unavailable."
        description="You can retry Google access or continue with the local browser snapshot while offline."
      />
    );
  }

  // Stato normale dell'app: sessione risolta e dati pronti.
  return <Dashboard />;
}

export default App;
