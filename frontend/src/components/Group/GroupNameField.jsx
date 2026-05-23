// Campo input per il nome del gruppo con validazione realtime e character counter.
function GroupNameField({
  value = '',
  onChange,
  error = null,
  minLength = 3,
  maxLength = 50,
}) {
  const charCount = value.length;

  return (
    <div className="group-modal__field">
      <label htmlFor="groupName" className="form-label">Group Name</label>
      <input
        id="groupName"
        type="text"
        className={`group-modal__input ${error ? 'is-invalid' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter group name"
        minLength={minLength}
        maxLength={maxLength}
        required
        aria-label="Group name"
        aria-describedby={error ? 'name-error' : 'name-helper'}
        aria-invalid={error ? 'true' : 'false'}
        aria-required="true"
      />
      {error ? (
        <div id="name-error" className="invalid-feedback">
          {error}
        </div>
      ) : (
        <small id="name-helper" className="group-modal__helper">
          {minLength}-{maxLength} characters
        </small>
      )}
      <div className="group-modal__counter">
        {charCount}/{maxLength}
      </div>
    </div>
  );
}

export default GroupNameField;
