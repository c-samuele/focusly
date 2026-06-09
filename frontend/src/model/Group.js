// Modello minimale del gruppo.
// Centralizza i valori ammessi per lo stato e normalizza la struttura dati.
import {
  normalizeGroupColor,
  normalizeGroupType,
} from '../utils/groupAppearance';

const GROUP_STATUSES = ['inactive', 'in_progress', 'completed'];

const createMilestoneId = (milestone = {}, index = 0) => {
  if (typeof milestone.id === 'string' && milestone.id.trim()) {
    return milestone.id;
  }

  const normalizedDescription = String(milestone.description ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

  return `milestone-${index}-${normalizedDescription || 'item'}`;
};

const createGroup = (data = {}) => {
  const id = data.id ?? '';
  const name = data.name ?? '';
  const colorSeed = `${id}|${name}`;

  return {
    id,
    name,
    type: normalizeGroupType(data.type),
    color: normalizeGroupColor(data.color, colorSeed),
    status: GROUP_STATUSES.includes(data.status) ? data.status : 'inactive',
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
    milestones: Array.isArray(data.milestones) ? data.milestones.map((m, index) => ({
      id: createMilestoneId(m, index),
      description: m.description ?? '',
      completed: Boolean(m.completed),
    })) : [],
  };
};

export { GROUP_STATUSES, createGroup };
