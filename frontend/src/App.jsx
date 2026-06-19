// Componente radice dell'applicazione.
// Gestisce bootstrap auth + dati prima di mostrare la dashboard.
import { useEffect } from 'react';
import BrandLogo from './components/Brand/BrandLogo';
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
  const handleAuthStateChange = useAppStore((state) => state.handleAuthStateChange);
  const signInWithGoogle = useAppStore((state) => state.signInWithGoogle);

  useEffect(() => {
    applyThemeToDocument(getInitialTheme());
  }, []);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      handleAuthStateChange(user);
    });

    return () => unsubscribe();
  }, [handleAuthStateChange]);

  if (authStatus === 'loading') {
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
      <BootstrapScreen
        eyebrow={migrationStatus === 'running' ? 'Import' : 'Sync'}
        title={migrationStatus === 'running' ? 'Importing your backup' : 'Loading your workspace'}
        status={migrationStatus === 'running' ? 'Merging local data' : 'Fetching cloud data'}
        detail={migrationStatus === 'running' ? 'Almost ready' : 'Building focus view'}
      />
    );
  }

  if (dataStatus === 'error') {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card--loading">
          <BrandLogo
            subtitle="Focus Workspace"
            orientation="stacked"
            size="lg"
            className="auth-card__brand auth-card__brand--loading"
          />
          <h1>Bootstrap unavailable.</h1>
          <p>{appError || 'Check Firebase config, rules and env vars.'}</p>
        </section>
      </main>
    );
  }

  return <Dashboard />;
}

export default App;
