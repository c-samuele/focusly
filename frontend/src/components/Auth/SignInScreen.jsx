import { useState } from 'react';
import BrandLogo from '../Brand/BrandLogo';
import { getRandomAphorism } from '../UI/BootstrapScreen';
import Button from '../UI/Button';

function SignInScreen({ onSignIn, isSigningIn, errorMessage }) {
  const [aphorism] = useState(getRandomAphorism);

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--signin">
        <BrandLogo subtitle="Focus Workspace" orientation="stacked" size="lg" className="auth-card__brand" />
        <div className="auth-card__intro">
          <span className="auth-card__eyebrow">Access</span>
          <h1>Enter your focus workspace.</h1>
          <p>Sync tasks, groups and milestones with your Google account.</p>
        </div>

        <div className="auth-card__actions">
          <Button type="button" variant="primary" onClick={onSignIn} disabled={isSigningIn}>
          <i className="bi bi-google" aria-hidden="true" /> {isSigningIn ? 'Accesso in corso...' : 'Continua con Google'}
          </Button>
        </div>

        <figure className="auth-card__quote">
          <blockquote>{aphorism.text}</blockquote>
          <figcaption>{aphorism.author}</figcaption>
        </figure>

        {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}
      </section>
    </main>
  );
}

export default SignInScreen;
