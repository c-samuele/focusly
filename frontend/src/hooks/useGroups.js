// Hook di comodo per leggere e manipolare i gruppi dal global store.
import { useAppStore } from '../state/store';

export const useGroups = () => {
  const groups = useAppStore((state) => state.groups);
  const selectedGroupId = useAppStore((state) => state.selectedGroupId);
  const createGroup = useAppStore((state) => state.createGroup);
  const updateGroup = useAppStore((state) => state.updateGroup);
  const deleteGroup = useAppStore((state) => state.deleteGroup);
  const selectGroup = useAppStore((state) => state.selectGroup);

  return {
    groups,
    selectedGroupId,
    createGroup,
    updateGroup,
    deleteGroup,
    selectGroup,
  };
};
