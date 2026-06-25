// Header sticky della dashboard.
// Organizza brand, navigazione, controlli di vista e quick actions account-centriche.
import { useEffect, useState } from 'react';
import BrandLogo from '../Brand/BrandLogo';
import Button from '../UI/Button';

function Header({
  onToggleSidebar,
  showSidebarToggle,
  activeTab,
  onShowAnalytics,
  onShowSettings,
  isFullscreen,
  onToggleFullscreen,
  authUser,
  onSignOut,
}) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarUrl = authUser?.photoURL || '';

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__brand">
        {showSidebarToggle && (
          <Button
            variant="ghost"
            className="dashboard-header__tool-button icon-button"
            onClick={onToggleSidebar}
            aria-label="Attiva/disattiva sidebar"
            title="Attiva/disattiva sidebar"
          >
            <i className="bi bi-list" aria-hidden="true" />
          </Button>
        )}
        <BrandLogo subtitle="Focus Workspace" className="dashboard-header__logo" size="sm" />
      </div>

      

      <div className="dashboard-header__actions" aria-label="Azioni header">
        <div className="dashboard-header__account">
          {avatarUrl && !avatarLoadFailed ? (
            <img
              className="dashboard-header__avatar"
              src={avatarUrl}
              alt={authUser?.displayName || 'User'}
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
          className="dashboard-header__tool-button dashboard-header__analytics-button icon-button"
          onClick={onShowAnalytics}
          aria-label="Apri analytics dashboard"
          title="Apri analytics dashboard"
        >
          <i className="bi bi-bar-chart-line-fill" aria-hidden="true" />
        </Button>

        <Button
          variant={activeTab === 'settings' ? 'primary' : 'ghost'}
          className="dashboard-header__tool-button dashboard-header__settings-button icon-button"
          onClick={onShowSettings}
          aria-label="Apri settings"
          title="Apri settings"
        >
          <i className="bi bi-sliders2" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          className="dashboard-header__tool-button dashboard-header__fullscreen-button icon-button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}
          title={isFullscreen ? 'Esci da fullscreen' : 'Vai in fullscreen'}
        >
          <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`} aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          className="dashboard-header__tool-button dashboard-header__tool-button--logout dashboard-header__logout-button icon-button"
          onClick={onSignOut}
          aria-label="Esci"
          title="Esci"
        >
          <i className="bi bi-box-arrow-right" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}

export default Header;
