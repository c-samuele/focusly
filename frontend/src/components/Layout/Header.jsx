// Header sticky della dashboard.
// Contiene toggle sidebar, periodo, tema e fullscreen.
import { useEffect, useState } from 'react';
import Button from '../UI/Button';

function Header({
  onToggleSidebar,
  showSidebarToggle,
  activeTab,
  onShowAnalytics,
  theme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
  authUser,
  onReimportLocalData,
  isReimporting,
  onSignOut,
}) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarUrl = authUser?.photoURL || '';

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        {showSidebarToggle && (
          <Button
            variant="ghost"
            className="icon-button"
            onClick={onToggleSidebar}
            aria-label="Attiva/disattiva sidebar"
            title="Attiva/disattiva sidebar"
          >
            <i className="bi bi-list" aria-hidden="true" />
          </Button>
        )}
        <div className="dashboard-header__title">
          <h1>Study Dashboard</h1>
        </div>
      </div>

      <div className="dashboard-header__right">
        <div className="dashboard-header__account">
          {avatarUrl && !avatarLoadFailed ? (
            <img
              className="dashboard-header__avatar"
              src={avatarUrl}
              alt={authUser.displayName || 'User'}
              referrerPolicy="no-referrer"
              onError={() => setAvatarLoadFailed(true)}
            />
          ) : (
            <span className="dashboard-header__avatar dashboard-header__avatar--fallback">
              {(authUser?.displayName || authUser?.email || 'U').slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="dashboard-header__account-copy">
            <strong>{authUser?.displayName || 'Google User'}</strong>
            <span>{authUser?.email || 'Authenticated session'}</span>
          </div>
        </div>
        <Button
          variant={activeTab === 'analytics' ? 'primary' : 'ghost'}
          className="icon-button"
          onClick={onShowAnalytics}
          aria-label="Mostra analytics"
          title="Mostra analytics"
        >
          <i className="bi bi-bar-chart-line-fill" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
          title={theme === 'dark' ? 'Attiva tema chiaro' : 'Attiva tema scuro'}
        >
          <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}
            title={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}
        >
          <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`} aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          className="header-action-button"
          onClick={onReimportLocalData}
          disabled={isReimporting}
          aria-label="Reimporta dati locali"
          title="Reimporta dati locali"
        >
          <i className="bi bi-arrow-repeat" aria-hidden="true" /> {isReimporting ? 'Reimport...' : 'Reimporta'}
        </Button>
        <Button
          variant="ghost"
          className="header-action-button"
          onClick={onSignOut}
          aria-label="Esci"
          title="Esci"
        >
          <i className="bi bi-box-arrow-right" aria-hidden="true" /> Esci
        </Button>
      </div>
    </header>
  );
}

export default Header;
