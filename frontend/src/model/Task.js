// Modello del task.
// Uniforma i dati letti da storage e fornisce i default usati da tutta l'app.
const PRIORITIES = ['low', 'medium', 'high'];

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createTask = (data = {}) => ({
  id: data.id ?? '',
  title: data.title ?? '',
  desc: data.desc ?? '',
  note: data.note ?? '',
  timer: Number.isFinite(Number(data.timer)) ? Number(data.timer) : 0,
  completed: Boolean(data.completed),
  priority: PRIORITIES.includes(data.priority) ? data.priority : 'medium',
  groupId: data.groupId ?? '',
  scheduledDate: data.scheduledDate ?? getTodayDate(),
  createdAt: data.createdAt ?? new Date().toISOString(),
  completedAt: data.completed ? data.completedAt ?? data.createdAt ?? new Date().toISOString() : null,
});

export { PRIORITIES, createTask, getTodayDate };
