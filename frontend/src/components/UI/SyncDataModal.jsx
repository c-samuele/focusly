import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';

function SyncDataModal({
  isOpen,
  isSubmitting,
  groupsCount,
  tasksCount,
  pendingTasksCount,
  onCancel,
  onConfirm,
}) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen || !modalRoot) {
    return null;
  }

  return createPortal(
    <>
      <div className="modal fade show d-block sync-modal" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="syncDataModalTitle">
        <div className="modal-dialog modal-dialog-centered sync-modal__dialog">
          <div className="modal-content sync-modal__content">
            <div className="modal-header sync-modal__header">
              <div className="sync-modal__header-copy">
                <span className="sync-modal__eyebrow">Cloud sync</span>
                <h3 id="syncDataModalTitle" className="modal-title">Reimport local data to Firestore</h3>
                <p>
                  Current localStorage content will be pushed to your cloud workspace. Matching document IDs will be updated, while missing remote documents will stay untouched.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onCancel}
                disabled={isSubmitting}
              />
            </div>

            <div className="modal-body sync-modal__body">
              <div className="sync-modal__stats">
                <article className="sync-modal__stat">
                  <span>Groups</span>
                  <strong>{groupsCount}</strong>
                </article>
                <article className="sync-modal__stat">
                  <span>Total tasks</span>
                  <strong>{tasksCount}</strong>
                </article>
                <article className="sync-modal__stat">
                  <span>Pending tasks</span>
                  <strong>{pendingTasksCount}</strong>
                </article>
              </div>
              <div className="sync-modal__note">
                <i className="bi bi-info-circle-fill" aria-hidden="true" />
                <p>Use this when you want to manually align older local data with the current Firestore workspace.</p>
              </div>
            </div>

            <div className="modal-footer sync-modal__footer">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={onConfirm} disabled={isSubmitting}>
                <i className={`bi bi-arrow-repeat ${isSubmitting ? 'dashboard-header__spin' : ''}`} aria-hidden="true" />
                {isSubmitting ? 'Syncing...' : 'Start sync'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show sync-modal__backdrop"
        onClick={isSubmitting ? undefined : onCancel}
      />
    </>,
    modalRoot
  );
}

export default SyncDataModal;
