import Button from '../UI/Button';

function SignInScreen({ onSignIn, isSigningIn, errorMessage }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="auth-card__eyebrow">Focusly</span>
        <h1>Accedi con Google per sincronizzare task, gruppi e milestone.</h1>
        <p>
          I dati locali restano come backup nel browser. Al primo accesso importeremo automaticamente
          `studyPlannerData` su Firestore senza cambiare il comportamento dell&apos;app.
        </p>

        <Button type="button" variant="primary" onClick={onSignIn} disabled={isSigningIn}>
          <i className="bi bi-google" aria-hidden="true" /> {isSigningIn ? 'Accesso in corso...' : 'Continua con Google'}
        </Button>

        {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}
      </section>
    </main>
  );
}

export default SignInScreen;
