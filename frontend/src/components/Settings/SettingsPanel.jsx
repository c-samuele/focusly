import { useEffect, useMemo, useState } from 'react';
import Button from '../UI/Button';

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

const SOURCE_LABELS = {
  localStorage: 'Initial localStorage import',
  'localStorage-manual-merge': 'Manual localStorage merge',
  'localStorage-blocked-different-account': 'Local data blocked for another account',
  'firestore-sync': 'Firestore backup refresh',
  'no-local-data': 'No localStorage data found',
};

function SettingsPanel({
  theme,
  onSetTheme,
  statsPeriod,
  onStatsPeriodChange,
  authUser,
  groupsCount,
  tasksCount,
  completedTasksCount,
  pendingTasksCount,
  selectedGroupName,
  migrationSource,
  isReimporting,
  onOpenSyncModal,
  onShowAnalytics,
}) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const avatarUrl = authUser?.photoURL || '';

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarUrl]);

  const completionRate = useMemo(
    () => (tasksCount ? Math.round((completedTasksCount / tasksCount) * 100) : 0),
    [completedTasksCount, tasksCount]
  );

  const dataSourceLabel = SOURCE_LABELS[migrationSource] ?? 'Firestore workspace';

  return (
    <section className="panel panel--settings settings-screen workspace-screen">
      <div className="settings-screen__hero workspace-screen__hero">
        <div className="settings-screen__hero-copy workspace-screen__hero-copy">
          <span className="settings-screen__eyebrow">Settings</span>
          <h2>Workspace settings</h2>
          <p>Refine the experience, inspect what is loaded in the app, and keep your cloud data aligned.</p>
        </div>
        <div className="settings-screen__hero-actions workspace-screen__hero-actions">
          <Button type="button" variant="ghost" onClick={onShowAnalytics}>
            <i className="bi bi-bar-chart-line-fill" aria-hidden="true" /> Open analytics
          </Button>
          <Button type="button" variant="primary" onClick={onOpenSyncModal} disabled={isReimporting}>
            <i className={`bi bi-arrow-repeat ${isReimporting ? 'dashboard-header__spin' : ''}`} aria-hidden="true" />
            {isReimporting ? 'Sync in progress' : 'Sync local data'}
          </Button>
        </div>
      </div>

      <div className="workspace-screen__viewport">
        <div className="workspace-screen__scroll">
          <div className="workspace-screen__body">
            <div className="settings-screen__grid">
              <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <span className="settings-card__eyebrow">Appearance</span>
              <h3>Theme</h3>
            </div>
            <i className="bi bi-palette2" aria-hidden="true" />
          </div>
          <p className="settings-card__description">
            Keep contrast balanced in both light and dark mode while preserving the dashboard palette.
          </p>
          <div className="settings-choice-grid">
            <button
              type="button"
              className={`settings-choice ${theme === 'light' ? 'is-active' : ''}`}
              onClick={() => onSetTheme('light')}
            >
              <i className="bi bi-brightness-high-fill" aria-hidden="true" />
              <span>Light mode</span>
            </button>
            <button
              type="button"
              className={`settings-choice ${theme === 'dark' ? 'is-active' : ''}`}
              onClick={() => onSetTheme('dark')}
            >
              <i className="bi bi-moon-stars-fill" aria-hidden="true" />
              <span>Dark mode</span>
            </button>
          </div>
              </section>

              <section className="settings-card">
          <div className="settings-card__header">
            <div>
              <span className="settings-card__eyebrow">Analytics</span>
              <h3>Default period</h3>
            </div>
            <i className="bi bi-graph-up-arrow" aria-hidden="true" />
          </div>
          <p className="settings-card__description">
            Choose the time window that opens first when you jump into the analytics dashboard.
          </p>
          <div className="settings-pill-group" role="group" aria-label="Analytics period">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`settings-pill ${statsPeriod === option.value ? 'is-active' : ''}`}
                onClick={() => onStatsPeriodChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
              </section>

              <section className="settings-card settings-card--account">
          <div className="settings-card__header">
            <div>
              <span className="settings-card__eyebrow">Account</span>
              <h3>Signed-in profile</h3>
            </div>
            <i className="bi bi-person-circle" aria-hidden="true" />
          </div>
          <div className="settings-account">
            {avatarUrl && !avatarLoadFailed ? (
              <img
                className="settings-account__avatar"
                src={avatarUrl}
                alt={authUser?.displayName || 'User'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <span className="settings-account__avatar settings-account__avatar--fallback">
                {(authUser?.displayName || authUser?.email || 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="settings-account__copy">
              <strong>{authUser?.displayName || 'Google User'}</strong>
              <span>{authUser?.email || 'Authenticated session'}</span>
            </div>
          </div>
          <dl className="settings-meta-list">
            <div>
              <dt>Selected group</dt>
              <dd>{selectedGroupName || 'No group selected'}</dd>
            </div>
            <div>
              <dt>Data source</dt>
              <dd>{dataSourceLabel}</dd>
            </div>
          </dl>
              </section>

              <section className="settings-card settings-card--data">
          <div className="settings-card__header">
            <div>
              <span className="settings-card__eyebrow">Data</span>
              <h3>Loaded workspace</h3>
            </div>
            <i className="bi bi-database-check" aria-hidden="true" />
          </div>
          <div className="settings-stats-grid">
            <article className="settings-stat">
              <span>Groups</span>
              <strong>{groupsCount}</strong>
            </article>
            <article className="settings-stat">
              <span>Total tasks</span>
              <strong>{tasksCount}</strong>
            </article>
            <article className="settings-stat">
              <span>Completed</span>
              <strong>{completedTasksCount}</strong>
            </article>
            <article className="settings-stat">
              <span>Pending</span>
              <strong>{pendingTasksCount}</strong>
            </article>
          </div>
          <div className="settings-data-highlight">
            <span>Completion rate</span>
            <strong>{completionRate}%</strong>
            <p>Your current workspace snapshot is ready for analytics and backup sync.</p>
          </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SettingsPanel;
