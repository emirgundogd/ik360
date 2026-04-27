import { AppState, SyncStatus } from '../types';

const STORAGE_KEY = 'ik360_app_state';

export const persistence = {
  load: async (): Promise<{ state: AppState; source: string }> => {
    console.log("Persistence load started...");
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        console.log("Persistence load found data.");
        return { state: JSON.parse(data), source: 'local' };
      }
    } catch (e) {
      console.error("localStorage access denied during load", e);
    }
    console.log("Persistence load found no data or access denied.");
    return { state: {} as AppState, source: 'default' };
  },
  
  scheduleSave: (() => {
    let timeoutId: any = null;
    return (
      state: AppState,
      setSyncStatus: (status: SyncStatus) => void,
      onSaved: (version: number) => void
    ) => {
      if (timeoutId) clearTimeout(timeoutId);
      setSyncStatus('syncing');
      timeoutId = setTimeout(() => {
        try {
          const version = Date.now();
          const stateToSave = { ...state, version, lastBackupTime: new Date().toISOString() };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
          setSyncStatus('synced');
          onSaved(version);
        } catch (e) {
          console.error("localStorage access denied during save", e);
          setSyncStatus('error');
        }
      }, 1000);
    };
  })()
};
