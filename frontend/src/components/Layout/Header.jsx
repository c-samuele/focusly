// Header sticky della dashboard.
// Contiene toggle sidebar, periodo, tema e fullscreen.
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
}) {
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
      </div>
    </header>
  );
}

export default Header;
