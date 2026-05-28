const GROUP_TYPE_OPTIONS = ['STUDY', 'WORK', 'UNIVERSITY'];

const GROUP_TYPE_LABELS = {
  STUDY: 'Study',
  WORK: 'Work',
  UNIVERSITY: 'University',
};

const DEFAULT_GROUP_TYPE = 'STUDY';

const DEFAULT_GROUP_COLORS = [
  '#2B6CB0',
  '#2C7DA0',
  '#2A9D8F',
  '#3A86B7',
  '#1F7A8C',
  '#4D9DE0',
  '#3BA7B8',
  '#4C6FFF',
];

const isValidHexColor = (value) => /^#[0-9A-F]{6}$/i.test(String(value ?? '').trim());

const normalizeHexColor = (value) => String(value ?? '').trim().toUpperCase();

const hashString = (value = '') => {
  let hash = 0;

  for (const char of String(value)) {
    hash = ((hash << 5) - hash) + char.charCodeAt(0);
    hash |= 0;
  }

  return Math.abs(hash);
};

const getDefaultGroupColor = (seed = '') => (
  DEFAULT_GROUP_COLORS[hashString(seed || 'default-group') % DEFAULT_GROUP_COLORS.length]
);

const normalizeGroupType = (value) => {
  const normalizedType = String(value ?? '').trim().toUpperCase();
  return GROUP_TYPE_OPTIONS.includes(normalizedType) ? normalizedType : DEFAULT_GROUP_TYPE;
};

const normalizeGroupColor = (value, seed = '') => (
  isValidHexColor(value) ? normalizeHexColor(value) : getDefaultGroupColor(seed)
);

const hexToRgb = (hexColor) => {
  const normalizedColor = normalizeGroupColor(hexColor);

  return {
    r: parseInt(normalizedColor.slice(1, 3), 16),
    g: parseInt(normalizedColor.slice(3, 5), 16),
    b: parseInt(normalizedColor.slice(5, 7), 16),
  };
};

const rgbToHex = ({ r, g, b }) => {
  const toHex = (value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const lightenHexColor = (hexColor, amount = 0.2) => {
  const { r, g, b } = hexToRgb(hexColor);

  return rgbToHex({
    r: r + ((255 - r) * amount),
    g: g + ((255 - g) * amount),
    b: b + ((255 - b) * amount),
  });
};

const hexToRgba = (hexColor, alpha = 1) => {
  const { r, g, b } = hexToRgb(hexColor);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getGroupAccentStyle = (color) => {
  const accent = normalizeGroupColor(color);
  const ring = hexToRgba(lightenHexColor(accent, 0.22), 0.28);

  return {
    '--group-accent': accent,
    '--group-accent-ring': ring,
  };
};

export {
  DEFAULT_GROUP_COLORS,
  DEFAULT_GROUP_TYPE,
  GROUP_TYPE_LABELS,
  GROUP_TYPE_OPTIONS,
  getDefaultGroupColor,
  getGroupAccentStyle,
  hexToRgba,
  isValidHexColor,
  lightenHexColor,
  normalizeGroupColor,
  normalizeGroupType,
};
