import { useSettingsContext } from '../context/SettingsContext';

// Re-export hook for backward compatibility
export const useSettings = () => {
  return useSettingsContext();
};
