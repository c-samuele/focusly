import { useRef } from 'react';
import MilestonesList from './MilestonesList';

// Campo per aggiungere milestones con input singolo, import multilinea e lista.
function MilestonesField({
  milestones = [],
  newMilestoneText = '',
  bulkMilestonesText = '',
  dropActive = false,
  onNewMilestoneChange,
  onBulkMilestonesChange,
  onAddMilestone,
  onImportMilestones,
  onRemoveMilestone,
  onToggleComplete,
  onFileUpload,
  setDropActive,
  error = null,
}) {
  const fileInputRef = useRef(null);
  const canAddMilestone = newMilestoneText.trim().length > 0;
  const canImportBulk = bulkMilestonesText.trim().length > 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canAddMilestone) {
      e.preventDefault();
      onAddMilestone();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      return;
    }

    const content = await file.text();
    onFileUpload(content);
    event.target.value = '';
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDropActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) return;

    const content = await file.text();
    onFileUpload(content);
  };

  return (
    <div className="group-modal__milestones">
      <div className="group-modal__milestones-header">
        <label htmlFor="milestone-input" className="form-label">Milestones</label>
        <span className="group-modal__milestone-count">{milestones.length}</span>
      </div>

      <div className="group-modal__milestone-field">
        <input
          id="milestone-input"
          type="text"
          className="group-modal__milestone-input"
          value={newMilestoneText}
          onChange={(e) => onNewMilestoneChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a milestone, then click Add"
          aria-label="New milestone"
          aria-describedby={error ? 'milestone-error' : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
        <button
          type="button"
          className="group-modal__milestone-add"
          onClick={onAddMilestone}
          disabled={!canAddMilestone}
          aria-label="Add milestone"
          title="Add milestone"
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Add
        </button>
      </div>

      <div
        className={`group-modal__bulk-milestones ${dropActive ? 'group-modal__bulk-milestones--active' : ''}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDropActive(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDropActive(false);
        }}
        onDrop={handleDrop}
        aria-label="Drop a text file with milestones or paste milestones here"
      >
        <textarea
          id="bulk-milestones"
          className="group-modal__bulk-textarea"
          value={bulkMilestonesText}
          onChange={(e) => onBulkMilestonesChange(e.target.value)}
          placeholder="Paste milestones here, one per line."
          aria-label="Bulk milestones input"
        />
        <div className="group-modal__bulk-actions">
          <button
            type="button"
            className="group-modal__milestone-add"
            onClick={onImportMilestones}
            disabled={!canImportBulk}
            aria-label="Import milestones"
          >
            <i className="bi bi-upload" aria-hidden="true" />
            Import
          </button>
          <button
            type="button"
            className="group-modal__milestone-add group-modal__milestone-add--secondary"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload milestones file"
          >
            <i className="bi bi-file-earmark-arrow-up" aria-hidden="true" />
            Upload .txt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            className="visually-hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {error && (
        <div id="milestone-error" className="invalid-feedback" style={{ display: 'block' }}>
          {error}
        </div>
      )}

      <MilestonesList
        milestones={milestones}
        onRemove={onRemoveMilestone}
        onToggleComplete={onToggleComplete}
      />
    </div>
  );
}

export default MilestonesField;
