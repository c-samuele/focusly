// Modello minimale del gruppo.
// Centralizza i valori ammessi per lo stato e normalizza la struttura dati.
const GROUP_STATUSES = ['inactive', 'in_progress', 'completed'];

const createGroup = (data = {}) => ({
  id: data.id ?? '',
  name: data.name ?? '',
  status: GROUP_STATUSES.includes(data.status) ? data.status : 'inactive',
  milestones: Array.isArray(data.milestones) ? data.milestones.map(m => ({
    description: m.description ?? '',
    completed: Boolean(m.completed),
  })) : [],
});

export { GROUP_STATUSES, createGroup };
