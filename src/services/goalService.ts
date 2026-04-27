
import { Goal } from '../types/task';

const STORAGE_KEY = 'ik360_goals';

export const goalService = {
  getGoals: (includeDeleted = false, source?: Goal[]): Goal[] => {
    let goals: Goal[] = [];
    if (source) {
      goals = source;
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        goals = JSON.parse(stored);
      } else {
        goals = goalService.seedGoals();
      }
    }
    
    if (!includeDeleted) {
      return goals.filter(g => !g.isDeleted);
    }
    return goals;
  },

  seedGoals: (): Goal[] => {
    const initialGoals: Goal[] = [
      {
        id: 'GOAL-1',
        title: 'Puantaj Doğruluk Oranını Artır',
        description: 'Aylık puantaj verilerindeki hata payını %1\'in altına indir.',
        targetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0).toISOString(),
        status: 'active',
        progress: 65,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'GOAL-2',
        title: 'Dijital Arşiv Tamamlama',
        description: 'Tüm personel özlük dosyalarının dijital ortama aktarılması.',
        targetDate: new Date(new Date().getFullYear(), 11, 31).toISOString(),
        status: 'active',
        progress: 40,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGoals));
    return initialGoals;
  },

  saveGoal: (goal: Goal, source?: Goal[]): Goal => {
    const goals = source ? [...source] : goalService.getGoals(true);
    const existingIndex = goals.findIndex(g => g.id === goal.id);
    let resultGoal = goal;
    
    if (existingIndex >= 0) {
      goals[existingIndex] = { ...goal, updatedAt: new Date().toISOString() };
    } else {
      resultGoal = { 
        ...goal, 
        id: `GOAL-${Date.now()}`, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      goals.push(resultGoal);
    }
    
    if (!source) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    }
    return resultGoal;
  },

  deleteGoal: (id: string, source?: Goal[]): void => {
    const goals = source ? [...source] : goalService.getGoals(true);
    const updated = goals.map(g => g.id === id ? { ...g, isDeleted: true, deletedAt: new Date().toISOString() } : g);
    if (!source) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  restoreGoal: (id: string, source?: Goal[]): void => {
    const goals = source ? [...source] : goalService.getGoals(true);
    const updated = goals.map(g => g.id === id ? { ...g, isDeleted: false, deletedAt: undefined } : g);
    if (!source) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  permanentDeleteGoal: (id: string, source?: Goal[]): void => {
    const goals = source ? [...source] : goalService.getGoals(true);
    const filtered = goals.filter(g => g.id !== id);
    if (!source) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  }
};
