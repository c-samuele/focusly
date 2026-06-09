// Componente radice dell'applicazione.
// Gestisce bootstrap auth + dati prima di mostrare la dashboard.
import { useEffect } from 'react';
import SignInScreen from './components/Auth/SignInScreen';
import Dashboard from './pages/Dashboard';
import { authService } from './services/authService';
import { useAppStore } from './state/store';

function App() {
  const authStatus = useAppStore((state) => state.authStatus);
  const dataStatus = useAppStore((state) => state.dataStatus);
  const migrationStatus = useAppStore((state) => state.migrationStatus);
  const appError = useAppStore((state) => state.appError);
  const isSigningIn = useAppStore((state) => state.isSigningIn);
  const handleAuthStateChange = useAppStore((state) => state.handleAuthStateChange);
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      handleAuthStateChange(user);
    });

    return () => unsubscribe();
  }, [handleAuthStateChange]);

  if (authStatus === 'loading') {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card--loading">
          <span className="auth-card__eyebrow">Focusly</span>
          <h1>Verifica della sessione in corso.</h1>
          <p>Sto controllando autenticazione e stato della migrazione Firebase.</p>
        </section>
      </main>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <SignInScreen
        onSignIn={signInWithGoogle}
        isSigningIn={isSigningIn}
        errorMessage={appError}
      />
    );
  }

  if (dataStatus === 'loading') {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card--loading">
          <span className="auth-card__eyebrow">Focusly</span>
          <h1>{migrationStatus === 'running' ? 'Migrazione iniziale in corso.' : 'Caricamento dati in corso.'}</h1>
          <p>
            {migrationStatus === 'running'
              ? 'Sto importando il localStorage nel tuo spazio Firestore e poi ricarico la dashboard.'
              : 'Sto caricando task, gruppi e milestone da Firestore.'}
          </p>
        </section>
      </main>
    );
  }

  if (dataStatus === 'error') {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card--loading">
          <span className="auth-card__eyebrow">Focusly</span>
          <h1>Impossibile completare il bootstrap Firebase.</h1>
          <p>{appError || 'Controlla configurazione Firebase, regole e variabili ambiente.'}</p>
        </section>
      </main>
    );
  }

  return <Dashboard />;
}

export default App;
