import {
  GROUP_TYPE_LABELS,
  GROUP_TYPE_OPTIONS,
  getGroupAccentStyle,
} from '../../utils/groupAppearance';

function GroupAppearanceField({
  type,
  color,
  onTypeChange,
  onColorChange,
}) {
  const accentStyle = getGroupAccentStyle(color);

  return (
    <div className="group-modal__appearance-grid">
      <div className="group-modal__field">
        <label htmlFor="groupType" className="form-label">Group Type</label>
        <select
          id="groupType"
          className="group-modal__input group-modal__select"
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          aria-label="Group type"
        >
          {GROUP_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {GROUP_TYPE_LABELS[option] ?? option}
            </option>
          ))}
        </select>
        <small className="group-modal__helper">
          Choose whether this group is for study or work.
        </small>
      </div>

      <div className="group-modal__field">
        <label htmlFor="groupColor" className="form-label">Group Color</label>
        <div className="group-modal__color-row">
          <label className="group-modal__color-picker" style={accentStyle}>
            <input
              id="groupColor"
              type="color"
              className="group-modal__color-input"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              aria-label="Group color"
            />
            <span className="group-modal__color-preview" aria-hidden="true" />
          </label>

          <span className="group-modal__color-value">{color}</span>
        </div>
        <small className="group-modal__helper">
          This color will be used for the group badge and the day analytics chart.
        </small>
      </div>
    </div>
  );
}

export default GroupAppearanceField;
