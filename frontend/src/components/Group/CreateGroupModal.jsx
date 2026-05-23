import { useEffect, useRef, useState } from 'react';
import Button from '../UI/Button';
import GroupNameField from './GroupNameField';
import MilestonesField from './MilestonesField';

function CreateGroupModal({ isOpen, editingGroup, onSubmit, onCancel, isLoading = false }) {
  const [name, setName] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [bulkMilestonesText, setBulkMilestonesText] = useState('');
  const [errors, setErrors] = useState({});
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const nameInputRef = useRef(null);
  const modalRef = useRef(null);

  // Load initial values when editingGroup changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingGroup) {
        setName(editingGroup.name);
        setMilestones(editingGroup.milestones || []);
      } else {
        setName('');
        setMilestones([]);
      }
      setNewMilestoneText('');
      setBulkMilestonesText('');
      setErrors({});

      // Auto-focus group name input
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 0);
    }
  }, [editingGroup, isOpen]);

  // Generate unique ID for milestones
  const generateMilestoneId = () => {
    return 'milestone-' + Date.now() + Math.random().toString(36).substr(2, 9);
  };

  // Validation functions
  const validateName = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Group name is required';
    if (trimmed.length < 3) return 'Group name must be at least 3 characters';
    if (trimmed.length > 50) return 'Group name must not exceed 50 characters';
    return null;
  };

  const validateMilestones = (ms) => {
    if (ms.length === 0) return 'At least one milestone is required';
    return null;
  };

  const parseMilestonesFromText = (text) => {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((description) => ({
        id: generateMilestoneId(),
        description,
        completed: false,
      }));
  };

  const mergeBulkMilestones = () => {
    if (!bulkMilestonesText.trim()) {
      return milestones;
    }

    const parsed = parseMilestonesFromText(bulkMilestonesText);
    if (parsed.length === 0) {
      return milestones;
    }

    return [...milestones, ...parsed];
  };

  const handleImportMilestones = () => {
    const imported = parseMilestonesFromText(bulkMilestonesText);
    if (imported.length === 0) {
      setErrors((prev) => ({ ...prev, milestone: 'Paste at least one valid milestone line.' }));
      return;
    }

    setMilestones((prev) => [...prev, ...imported]);
    setBulkMilestonesText('');
    setErrors((prev) => ({ ...prev, milestone: null }));
  };

  const handleFileUpload = (fileContent) => {
    const imported = parseMilestonesFromText(fileContent);
    if (imported.length === 0) {
      setErrors((prev) => ({ ...prev, milestone: 'Uploaded file contained no valid milestone lines.' }));
      return;
    }

    setMilestones((prev) => [...prev, ...imported]);
    setBulkMilestonesText('');
    setErrors((prev) => ({ ...prev, milestone: null }));
  };

  // Check if form has unsaved changes
  const checkUnsavedChanges = () => {
    if (!editingGroup) {
      return name.trim().length > 0 || milestones.length > 0;
    }
    return (
      name !== editingGroup.name ||
      JSON.stringify(milestones) !== JSON.stringify(editingGroup.milestones || [])
    );
  };

  // Handle name change with realtime validation
  const handleNameChange = (value) => {
    setName(value);
    if (errors.name) {
      const error = validateName(value);
      setErrors((prev) => ({ ...prev, name: error }));
    }
  };

  // Handle add milestone
  const handleAddMilestone = () => {
    const trimmed = newMilestoneText.trim();

    if (!trimmed) {
      setErrors((prev) => ({ ...prev, milestone: 'Milestone cannot be empty' }));
      return;
    }

    // Check for duplicates (soft warning, but allow)
    const isDuplicate = milestones.some(
      (m) => m.description.toLowerCase() === trimmed.toLowerCase()
    );

    const newMilestone = {
      id: generateMilestoneId(),
      description: trimmed,
      completed: false,
    };

    setMilestones((prev) => [...prev, newMilestone]);
    setNewMilestoneText('');
    setErrors((prev) => ({ ...prev, milestone: null }));

    if (isDuplicate) {
      // Show soft warning but don't prevent
      console.warn('Duplicate milestone added');
    }
  };

  // Handle remove milestone
  const handleRemoveMilestone = (index) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle toggle complete
  const handleToggleComplete = (index) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, completed: !m.completed } : m))
    );
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    const nameError = validateName(name);
    const milestonesError = validateMilestones(milestones);

    if (nameError || milestonesError) {
      setErrors({
        name: nameError,
        milestone: milestonesError,
      });
      return;
    }

    // Submit
    const finalMilestones = mergeBulkMilestones();

    onSubmit({
      name: name.trim(),
      milestones: finalMilestones,
    });

    setMilestones(finalMilestones);
    setBulkMilestonesText('');

    // Reset
    setName('');
    setMilestones([]);
    setNewMilestoneText('');
    setErrors({});
  };

  // Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (checkUnsavedChanges()) {
      setShowUnsavedWarning(true);
    } else {
      onCancel();
    }
  };

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, name, milestones, editingGroup]);

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div
        className="modal fade show d-block group-modal"
        ref={modalRef}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="groupModalTitle"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <div className="group-modal__header-wrapper">
                <div className="group-modal__header-icon">
                  <i className="bi bi-collection" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="groupModalTitle" className="group-modal__title">
                    {editingGroup ? 'Edit Group' : 'Create Group'}
                  </h3>
                  <p className="group-modal__subtitle">
                    {editingGroup
                      ? 'Update group details and milestones.'
                      : 'Add a new study group with milestones.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={handleCancel}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body group-modal__body">
                <GroupNameField
                  value={name}
                  onChange={handleNameChange}
                  error={errors.name}
                  minLength={3}
                  maxLength={50}
                />

                <MilestonesField
                  milestones={milestones}
                  newMilestoneText={newMilestoneText}
                  bulkMilestonesText={bulkMilestonesText}
                  dropActive={dropActive}
                  onNewMilestoneChange={setNewMilestoneText}
                  onBulkMilestonesChange={setBulkMilestonesText}
                  onAddMilestone={handleAddMilestone}
                  onImportMilestones={handleImportMilestones}
                  onRemoveMilestone={handleRemoveMilestone}
                  onToggleComplete={handleToggleComplete}
                  onFileUpload={handleFileUpload}
                  setDropActive={setDropActive}
                  error={errors.milestone}
                />
              </div>

              {/* Footer */}
              <div className="modal-footer group-modal__footer">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading || !!errors.name || !!errors.milestone}
                >
                  {isLoading
                    ? 'Saving...'
                    : editingGroup
                    ? 'Update Group'
                    : 'Create Group'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <>
          <div
            className="modal fade show d-block group-modal"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Discard Changes?</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUnsavedWarning(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <p>You have unsaved changes. Do you want to discard them?</p>
                </div>
                <div className="modal-footer">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowUnsavedWarning(false)}
                  >
                    Keep Editing
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setShowUnsavedWarning(false);
                      onCancel();
                    }}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowUnsavedWarning(false)}
            aria-hidden="true"
          />
        </>
      )}
    </>
  );
}

export default CreateGroupModal;
