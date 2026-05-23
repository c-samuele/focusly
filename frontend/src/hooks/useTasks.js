// Hook di accesso ai task.
// Restituisce sia tutti i task sia quelli filtrati per il gruppo selezionato.
import { useAppStore } from '../state/store';

export const useTasks = () => {
  const allTasks = useAppStore((state) => state.tasks);
  const selectedGroupId = useAppStore((state) => state.selectedGroupId);
  const createTask = useAppStore((state) => state.createTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const toggleTaskComplete = useAppStore((state) => state.toggleTaskComplete);

  return {
    tasks: selectedGroupId ? allTasks.filter((task) => task.groupId === selectedGroupId) : [],
    allTasks,
    selectedGroupId,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
  };
};
