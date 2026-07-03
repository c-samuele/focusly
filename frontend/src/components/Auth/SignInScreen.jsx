import { useState } from 'react';
import BrandLogo from '../Brand/BrandLogo';
import { getRandomAphorism } from '../UI/BootstrapScreen';
import Button from '../UI/Button';

function SignInScreen({
  onSignIn,
  onEnterOffline,
  isSigningIn,
  errorMessage,
  title = 'Enter your focus workspace.',
  description = 'Sync tasks, groups and milestones with your Google account.',
}) {
  const [aphorism] = useState(getRandomAphorism);

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--signin">
        <BrandLogo subtitle="Focus Workspace" orientation="stacked" size="lg" className="auth-card__brand" />
        <div className="auth-card__intro">
          <span className="auth-card__eyebrow">Access</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="auth-card__actions">
          <Button type="button" variant="primary" onClick={onSignIn} disabled={isSigningIn}>
            <i className="bi bi-google" aria-hidden="true" /> {isSigningIn ? 'Accesso in corso...' : 'Continua con Google'}
          </Button>
          <Button type="button" variant="ghost" onClick={onEnterOffline} disabled={isSigningIn}>
            <i className="bi bi-wifi-off" aria-hidden="true" /> Apri offline
          </Button>
        </div>

        <p className="auth-card__hint">
          Offline mode uses the current browser snapshot only. Sign in later to sync it to Firestore.
        </p>

        {errorMessage ? <p className="auth-card__error">{errorMessage}</p> : null}

        <div className="auth-card__mode-grid" aria-label="Available access modes">
          <article className="auth-card__mode">
            <strong>Google cloud access</strong>
            <span>Use Firebase Auth and keep the Firestore workspace aligned across sessions.</span>
          </article>
          <article className="auth-card__mode">
            <strong>Offline guest access</strong>
            <span>Continue from this browser, edit tasks locally and sync later when the connection returns.</span>
          </article>
        </div>

        <figure className="auth-card__quote">
          <blockquote>{aphorism.text}</blockquote>
          <figcaption>{aphorism.author}</figcaption>
        </figure>
      </section>
    </main>
  );
}

export default SignInScreen;
