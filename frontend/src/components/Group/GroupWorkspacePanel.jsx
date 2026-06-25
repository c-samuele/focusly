import { useEffect, useRef, useState } from 'react';
import Button from '../UI/Button';
import GroupAppearanceField from './GroupAppearanceField';
import GroupNameField from './GroupNameField';
import MilestoneItem from './MilestoneItem';
import MilestonesField from './MilestonesField';
import {
  DEFAULT_GROUP_TYPE,
  getDefaultGroupColor,
  normalizeGroupColor,
  normalizeGroupType,
} from '../../utils/groupAppearance';

const createWorkspaceState = () => ({ mode: null, groupId: null });

function GroupEditorWorkspace({ mode, group, onSubmit, onCancel, isLoading = false }) {
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState(DEFAULT_GROUP_TYPE);
  const [groupColor, setGroupColor] = useState(getDefaultGroupColor('new-group'));
  const [milestones, setMilestones] = useState([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [bulkMilestonesText, setBulkMilestonesText] = useState('');
  const [errors, setErrors] = useState({});
  const [dropActive, setDropActive] = useState(false);
  const [showDiscardNotice, setShowDiscardNotice] = useState(false);
  const nameInputRef = useRef(null);
  const isEditing = mode === 'edit';

  useEffect(() => {
    if (isEditing && !group) {
      return;
    }

    if (isEditing) {
      setName(group.name);
      setGroupType(normalizeGroupType(group.type));
      setGroupColor(normalizeGroupColor(group.color, `${group.id}|${group.name}`));
      setMilestones(group.milestones || []);
    } else {
      setName('');
      setGroupType(DEFAULT_GROUP_TYPE);
      setGroupColor(getDefaultGroupColor('new-group'));
      setMilestones([]);
    }

    setNewMilestoneText('');
    setBulkMilestonesText('');
    setErrors({});
    setDropActive(false);
    setShowDiscardNotice(false);

    const focusTimeoutId = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimeoutId);
    };
  }, [group, isEditing, mode]);

  const validateName = (value) => {
    const trimmed = value.trim();

    if (!trimmed) return 'Group name is required';
    if (trimmed.length < 3) return 'Group name must be at least 3 characters';
    if (trimmed.length > 50) return 'Group name must not exceed 50 characters';
    return null;
  };

  const validateMilestones = (items) => {
    if (items.length === 0) {
      return 'At least one milestone is required';
    }

    return null;
  };

  const generateMilestoneId = () => `milestone-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const parseMilestonesFromText = (text) => (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((description) => ({
        id: generateMilestoneId(),
        description,
        completed: false,
      }))
  );

  const mergeBulkMilestones = () => {
    if (!bulkMilestonesText.trim()) {
      return milestones;
    }

    const parsed = parseMilestonesFromText(bulkMilestonesText);
    return parsed.length > 0 ? [...milestones, ...parsed] : milestones;
  };

  const handleImportMilestones = () => {
    const imported = parseMilestonesFromText(bulkMilestonesText);

    if (imported.length === 0) {
      setErrors((current) => ({ ...current, milestone: 'Paste at least one valid milestone line.' }));
      return;
    }

    setMilestones((current) => [...current, ...imported]);
    setBulkMilestonesText('');
    setErrors((current) => ({ ...current, milestone: null }));
    setShowDiscardNotice(false);
  };

  const handleFileUpload = (fileContent) => {
    const imported = parseMilestonesFromText(fileContent);

    if (imported.length === 0) {
      setErrors((current) => ({ ...current, milestone: 'Uploaded file contained no valid milestone lines.' }));
      return;
    }

    setMilestones((current) => [...current, ...imported]);
    setBulkMilestonesText('');
    setErrors((current) => ({ ...current, milestone: null }));
    setShowDiscardNotice(false);
  };

  const checkUnsavedChanges = () => {
    if (!isEditing) {
      return (
        name.trim().length > 0 ||
        groupType !== DEFAULT_GROUP_TYPE ||
        groupColor !== getDefaultGroupColor('new-group') ||
        milestones.length > 0 ||
        newMilestoneText.trim().length > 0 ||
        bulkMilestonesText.trim().length > 0
      );
    }

    return (
      name !== group.name ||
      groupType !== normalizeGroupType(group.type) ||
      groupColor !== normalizeGroupColor(group.color, `${group.id}|${group.name}`) ||
      JSON.stringify(milestones) !== JSON.stringify(group.milestones || []) ||
      newMilestoneText.trim().length > 0 ||
      bulkMilestonesText.trim().length > 0
    );
  };

  const handleAttemptClose = () => {
    if (checkUnsavedChanges()) {
      setShowDiscardNotice(true);
      return;
    }

    onCancel();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();
      handleAttemptClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const handleNameChange = (value) => {
    setName(value);
    setShowDiscardNotice(false);

    if (errors.name) {
      setErrors((current) => ({ ...current, name: validateName(value) }));
    }
  };

  const handleAddMilestone = () => {
    const trimmed = newMilestoneText.trim();

    if (!trimmed) {
      setErrors((current) => ({ ...current, milestone: 'Milestone cannot be empty' }));
      return;
    }

    setMilestones((current) => [
      ...current,
      {
        id: generateMilestoneId(),
        description: trimmed,
        completed: false,
      },
    ]);
    setNewMilestoneText('');
    setErrors((current) => ({ ...current, milestone: null }));
    setShowDiscardNotice(false);
  };

  const handleRemoveMilestone = (index) => {
    setMilestones((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setShowDiscardNotice(false);
  };

  const handleToggleComplete = (index) => {
    setMilestones((current) => current.map((milestone, itemIndex) => (
      itemIndex === index ? { ...milestone, completed: !milestone.completed } : milestone
    )));
    setShowDiscardNotice(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nameError = validateName(name);
    const milestonesError = validateMilestones(milestones);

    if (nameError || milestonesError) {
      setErrors({
        name: nameError,
        milestone: milestonesError,
      });
      return;
    }

    onSubmit({
      name: name.trim(),
      type: normalizeGroupType(groupType),
      color: normalizeGroupColor(groupColor, name.trim()),
      milestones: mergeBulkMilestones(),
    });
  };

  return (
    <section className="panel panel--group-workspace group-workspace group-workspace--editor workspace-screen">
      <div className="group-workspace__hero group-workspace__hero--compact workspace-screen__hero">
        <div className="group-workspace__hero-copy workspace-screen__hero-copy">
          <span className="settings-screen__eyebrow">{isEditing ? 'Edit Group' : 'Create Group'}</span>
          <h2>{isEditing ? `Refine ${group?.name}` : 'Shape a new focus group'}</h2>
          <p>
            {isEditing
              ? 'Update naming, visual identity and milestone flow without leaving the main workspace.'
              : 'Build the group directly in the main workspace, with milestones and appearance settings in one place.'}
          </p>
        </div>

        <div className="group-workspace__hero-actions workspace-screen__hero-actions">
          <Button type="button" variant="ghost" onClick={handleAttemptClose} disabled={isLoading}>
            <i className="bi bi-arrow-left" aria-hidden="true" /> Back to tasks
          </Button>
          <Button type="submit" form="group-workspace-form" variant="primary" disabled={isLoading || !!errors.name || !!errors.milestone}>
            <i className={`bi ${isEditing ? 'bi-check2-circle' : 'bi-plus-circle'}`} aria-hidden="true" />
            {isLoading ? 'Saving...' : isEditing ? 'Update Group' : 'Create Group'}
          </Button>
        </div>
      </div>

      <div className="group-workspace__viewport workspace-screen__viewport">
        <form id="group-workspace-form" className="group-workspace__form" onSubmit={handleSubmit}>
          <div className="group-workspace__scroll workspace-screen__scroll">
            <div className="group-workspace__body workspace-screen__body">
              <section className="group-modal__panel">
                <div className="group-modal__section-heading">
                  <h4>Group details</h4>
                  <p>Choose a clear name and a visual cue that keeps the group easy to recognize.</p>
                </div>

                <GroupNameField
                  inputRef={nameInputRef}
                  value={name}
                  onChange={handleNameChange}
                  error={errors.name}
                  minLength={3}
                  maxLength={50}
                />

                <GroupAppearanceField
                  type={groupType}
                  color={groupColor}
                  onTypeChange={(value) => {
                    setGroupType(value);
                    setShowDiscardNotice(false);
                  }}
                  onColorChange={(value) => {
                    setGroupColor(normalizeGroupColor(value, name.trim()));
                    setShowDiscardNotice(false);
                  }}
                />
              </section>

              <section className="group-modal__panel">
                <MilestonesField
                  milestones={milestones}
                  newMilestoneText={newMilestoneText}
                  bulkMilestonesText={bulkMilestonesText}
                  dropActive={dropActive}
                  onNewMilestoneChange={(value) => {
                    setNewMilestoneText(value);
                    setShowDiscardNotice(false);
                  }}
                  onBulkMilestonesChange={(value) => {
                    setBulkMilestonesText(value);
                    setShowDiscardNotice(false);
                  }}
                  onAddMilestone={handleAddMilestone}
                  onImportMilestones={handleImportMilestones}
                  onRemoveMilestone={handleRemoveMilestone}
                  onToggleComplete={handleToggleComplete}
                  onFileUpload={handleFileUpload}
                  setDropActive={setDropActive}
                  error={errors.milestone}
                />
              </section>
            </div>
          </div>

          <div className="group-workspace__footer">
            {showDiscardNotice ? (
              <div className="group-workspace__notice" role="alert">
                <div className="group-workspace__notice-copy">
                  <strong>You have unsaved changes.</strong>
                  <span>Keep editing or discard them before leaving this screen.</span>
                </div>
                <div className="group-workspace__notice-actions">
                  <Button type="button" variant="ghost" onClick={() => setShowDiscardNotice(false)}>
                    Keep editing
                  </Button>
                  <Button type="button" variant="danger" onClick={onCancel}>
                    Discard changes
                  </Button>
                </div>
              </div>
            ) : (
              <p className="group-workspace__footer-note">
                The milestone list updates only when you save, so you can reorganize everything calmly before publishing changes.
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function GroupMilestonesWorkspace({ group, onCancel, onToggleMilestone, onEditGroup }) {
  const milestones = group?.milestones ?? [];
  const completedCount = milestones.filter((milestone) => milestone.completed).length;
  const totalCount = milestones.length;
  const remainingCount = totalCount - completedCount;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!group) {
    return null;
  }

  return (
    <section className="panel panel--group-workspace group-workspace group-workspace--milestones-view workspace-screen">
      <div className="group-workspace__hero group-workspace__hero--compact workspace-screen__hero">
        <div className="group-workspace__hero-main">
          <div className="group-workspace__hero-copy workspace-screen__hero-copy">
            <span className="settings-screen__eyebrow">Milestones</span>
            <h2>{group.name}</h2>
            <p>
              Track every checkpoint for this group inside the main workspace, with the same rhythm as the rest of the dashboard.
            </p>
          </div>
        </div>

        <div className="group-workspace__hero-side">
          <div className="group-workspace__hero-actions workspace-screen__hero-actions">
            <Button type="button" variant="ghost" onClick={onCancel}>
              <i className="bi bi-arrow-left" aria-hidden="true" /> Back to tasks
            </Button>
            <Button type="button" variant="primary" onClick={() => onEditGroup(group.id)}>
              <i className="bi bi-pencil-square" aria-hidden="true" /> Edit group
            </Button>
          </div>

          <div className="group-workspace__stats">
            <article className="milestone-summary-card">
              <span>Milestones</span>
              <strong>{totalCount}</strong>
            </article>
            <article className="milestone-summary-card">
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </article>
            <article className="milestone-summary-card">
              <span>Remaining</span>
              <strong>{remainingCount}</strong>
            </article>
          </div>
        </div>
      </div>

      <div className="group-workspace__viewport workspace-screen__viewport">
        <div className="group-workspace__scroll group-workspace__scroll--milestones workspace-screen__scroll">
          <div className="group-workspace__body group-workspace__body--milestones workspace-screen__body">
            <section className="group-modal__panel">
              <div className="milestones-modal__list-header">
                <div className="milestones-modal__list-copy">
                  <h4>Milestone list</h4>
                  <p>Each checkbox updates the group right away, so this view doubles as a lightweight control panel.</p>
                  <div className="milestones-modal__list-progress" aria-label={`Completion progress ${progressPercent}%`}>
                    <span>{progressPercent}% complete</span>
                    <div className="milestones-modal__list-progress-track" aria-hidden="true">
                      <span className="milestones-modal__list-progress-bar" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
                <span className="milestones-modal__list-badge">{completedCount}/{totalCount} done</span>
              </div>

              {milestones.length === 0 ? (
                <div className="group-modal__empty-state">
                  <i className="bi bi-list-check" aria-hidden="true" />
                  <p>No milestones defined for this group yet.</p>
                </div>
              ) : (
                <div className="milestones-list">
                  {milestones.map((milestone, index) => (
                    <MilestoneItem
                      key={milestone.id ?? index}
                      milestone={milestone}
                      index={index}
                      onToggle={onToggleMilestone}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function GroupWorkspacePanel({
  mode,
  group,
  onSubmit,
  onCancel,
  onToggleMilestone,
  onEditGroup,
  isLoading = false,
}) {
  if (mode === 'create' || mode === 'edit') {
    return (
      <GroupEditorWorkspace
        mode={mode}
        group={group}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isLoading={isLoading}
      />
    );
  }

  if (mode === 'milestones') {
    return (
      <GroupMilestonesWorkspace
        group={group}
        onCancel={onCancel}
        onToggleMilestone={onToggleMilestone}
        onEditGroup={onEditGroup}
      />
    );
  }

  return null;
}

export { createWorkspaceState };
export default GroupWorkspacePanel;
