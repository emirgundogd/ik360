
import { Task, TaskCategory, TaskPriority, TaskFrequency } from '../types/task';
import { AppConfig, DEFAULT_CONFIG } from '../types';

const STORAGE_KEY = 'ik360_tasks';
const SETTINGS_KEY = 'ik360_task_settings';

const MONTHLY_TASKS = [
  'Bordro Hazırlığı',
  'Aylık İzin Mutabakatı',
  'Performans Değerlendirme Raporu',
  'Aylık SGK Bildirgeleri',
  'Personel Maliyet Analizi'
];

const ONETIME_TASKS = [
  'Yeni Personel Oryantasyonu',
  'İş Sağlığı ve Güvenliği Eğitimi',
  'Yıllık İzin Planlaması',
  'Şirket İçi Etkinlik Organizasyonu'
];

// Helper to get system config
const getSystemConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem('ik360_db');
    if (stored) {
      const data = JSON.parse(stored);
      return data.config || DEFAULT_CONFIG;
    }
  } catch (e) {
    console.error("Failed to load system config", e);
  }
  return DEFAULT_CONFIG;
};

// Helper to adjust date to next workday if weekend
const adjustToWorkday = (dateStr: string): string => {
  const config = getSystemConfig();
  const weekendDays = config.weekendDays || [0, 6]; // Default to Sunday, Saturday if not set
  
  const date = new Date(dateStr);
  let day = date.getDay();
  
  // While day is a weekend day, add 1 day
  // Limit to 7 iterations to prevent infinite loop in case all days are weekends (unlikely but safe)
  let attempts = 0;
  while (weekendDays.includes(day) && attempts < 7) {
    date.setDate(date.getDate() + 1);
    day = date.getDay();
    attempts++;
  }
  
  return date.toISOString();
};

const generateNextOccurrence = (task: Task): Task | null => {
  if (!task.isRecurring || !task.plannedStartDate || !task.frequency) return null;

  const currentStartDate = new Date(task.plannedStartDate);
  const nextStartDate = new Date(currentStartDate);
  
  // Calculate next date based on frequency
  switch (task.frequency) {
    case 'daily':
      nextStartDate.setDate(nextStartDate.getDate() + 1);
      break;
    case 'weekly':
      nextStartDate.setDate(nextStartDate.getDate() + 7);
      break;
    case 'monthly':
      nextStartDate.setMonth(nextStartDate.getMonth() + 1);
      break;
    case 'yearly':
      nextStartDate.setFullYear(nextStartDate.getFullYear() + 1);
      break;
    default:
      return null;
  }

  // Adjust to workday
  const adjustedStartDate = adjustToWorkday(nextStartDate.toISOString());
  
  // Calculate end date duration
  let adjustedEndDate = undefined;
  if (task.plannedEndDate) {
    const currentEndDate = new Date(task.plannedEndDate);
    const duration = currentEndDate.getTime() - currentStartDate.getTime();
    const nextEndDate = new Date(new Date(adjustedStartDate).getTime() + duration);
    adjustedEndDate = nextEndDate.toISOString();
  }

  return {
    ...task,
    id: `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // New ID
    plannedStartDate: adjustedStartDate,
    plannedEndDate: adjustedEndDate,
    status: 'planned', // Reset status
    isRecurring: true, // Keep it recurring so it generates the next one too
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: task.steps?.map(s => ({ ...s, isCompleted: false })) // Reset steps
  };
};

// Helper to determine frequency and dates based on task name
const determineTaskProps = (name: string, category: TaskCategory): Partial<Task> => {
  const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let frequencyText = category === 'monthly' ? 'Her Ay' : 'Bir Defa';
    let frequency: TaskFrequency = category === 'monthly' ? 'monthly' : 'onetime';
    let priority: TaskPriority = 'medium';
    let estimatedDuration = '1 Saat';
    
    // Priority Logic
    const lowerName = name.toLowerCase();
    
    // Critical
    if (
      lowerName.includes('maaş') || 
      lowerName.includes('sgk') || 
      lowerName.includes('icra') || 
      lowerName.includes('bes') || 
      lowerName.includes('tebligat') ||
      lowerName.includes('işten çıkış') ||
      lowerName.includes('işe giriş')
    ) {
      priority = 'critical';
      estimatedDuration = '1 Gün';
    } 
    // High
    else if (
      lowerName.includes('puantaj') || 
      lowerName.includes('teşvik') || 
      lowerName.includes('izin') || 
      lowerName.includes('işgörmezlik') ||
      lowerName.includes('multinet') ||
      lowerName.includes('işkur') ||
      lowerName.includes('isg')
    ) {
      priority = 'high';
      estimatedDuration = '4 Saat';
    }
    // Low
    else if (
      lowerName.includes('geliştirme') || 
      lowerName.includes('iyileştirme') || 
      lowerName.includes('planlama') ||
      lowerName.includes('kazanım')
    ) {
      priority = 'low';
      estimatedDuration = '2 Gün';
    }
    // Medium (Default)
    else {
      priority = 'medium';
    }
  
    // Frequency Logic
    if (lowerName.includes('günlük')) {
      frequencyText = 'Her Gün';
      frequency = 'daily';
      estimatedDuration = '30 Dakika';
    } else if (lowerName.includes('haftalık')) {
      frequencyText = 'Her Hafta';
      frequency = 'weekly';
    }
  
    // Smart Date Planning
    let plannedStartDate = new Date(currentYear, currentMonth, 1).toISOString();
    let plannedEndDate = new Date(currentYear, currentMonth + 1, 0).toISOString();
  
    // Specific dates for payroll related tasks
    if (lowerName.includes('maaş öde')) {
      // Last week of month
      const lastDay = new Date(currentYear, currentMonth, daysInMonth);
      const startDay = new Date(currentYear, currentMonth, daysInMonth - 6);
      plannedStartDate = startDay.toISOString();
      plannedEndDate = lastDay.toISOString();
    } else if (lowerName.includes('puantaj')) {
      // 20-25 of month
      plannedStartDate = new Date(currentYear, currentMonth, 20).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, 25).toISOString();
    } else if (lowerName.includes('sgk') && lowerName.includes('bildirge')) {
      // 23-26 of month
      plannedStartDate = new Date(currentYear, currentMonth, 23).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, 26).toISOString();
    } else if (lowerName.includes('muhtasar')) {
      // 23-26 of month
      plannedStartDate = new Date(currentYear, currentMonth, 23).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, 26).toISOString();
    } else if (lowerName.includes('kdv')) {
      // 24-26 of month
      plannedStartDate = new Date(currentYear, currentMonth, 24).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, 26).toISOString();
    } else if (lowerName.includes('multinet')) {
      // First week
      plannedStartDate = new Date(currentYear, currentMonth, 1).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, 5).toISOString();
    } else if (lowerName.includes('işkur')) {
      // First week
      plannedStartDate = new Date(currentYear, currentMonth, 1).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, 7).toISOString();
    } else if (lowerName.includes('bes')) {
      // End of month
      plannedStartDate = new Date(currentYear, currentMonth, daysInMonth - 2).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, daysInMonth).toISOString();
    } else if (lowerName.includes('icra')) {
      // End of month
      plannedStartDate = new Date(currentYear, currentMonth, daysInMonth - 5).toISOString();
      plannedEndDate = new Date(currentYear, currentMonth, daysInMonth).toISOString();
    }

    // Apply Smart Workday Logic (Skip Weekends)
    // Only apply if it's a generated monthly task to ensure it lands on a workday
    if (frequency === 'monthly') {
      plannedStartDate = adjustToWorkday(plannedStartDate);
      plannedEndDate = adjustToWorkday(plannedEndDate);
    }
  
    // Steps Logic
    const steps = [
      { id: '1', title: 'Hazırlık işlemlerini tamamla', isCompleted: false },
      { id: '2', title: 'Gerekli evrakları kontrol et', isCompleted: false },
      { id: '3', title: 'İlgili birimden onay al', isCompleted: false },
      { id: '4', title: 'Sisteme veri girişini yap', isCompleted: false },
      { id: '5', title: 'Son kontrolleri gerçekleştir', isCompleted: false }
    ];
  
    if (lowerName.includes('maaş')) {
      steps.push({ id: '6', title: 'Banka ödeme dosyasını oluştur', isCompleted: false });
      steps.push({ id: '7', title: 'Finans departmanına ilet', isCompleted: false });
    }
  
    return {
      frequencyText,
      frequency,
      priority,
      estimatedDuration,
      plannedStartDate,
      plannedEndDate,
      status: 'planned', // Initial status
      steps
    };
  };

export const taskService = {
  getTasks: (includeDeleted = false, sourceTasks?: Task[]): Task[] => {
    let tasks: Task[] = [];
    
    if (sourceTasks) {
      tasks = sourceTasks;
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        tasks = JSON.parse(stored);
      } else {
        tasks = taskService.seedTasks();
      }
    }
    
    if (!includeDeleted) {
      tasks = tasks.filter(t => !t.isDeleted);
    }
    
    // Auto-check for delayed tasks on load
    const checkedTasks = taskService.checkDelayedTasks(tasks);
    if (!sourceTasks && JSON.stringify(checkedTasks) !== JSON.stringify(tasks)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedTasks));
      return checkedTasks;
    }
    
    return checkedTasks;
  },

  checkDelayedTasks: (tasks: Task[]): Task[] => {
    const now = new Date();
    // Reset time part to compare dates only
    now.setHours(0, 0, 0, 0);

    return tasks.map(task => {
      if (task.status === 'completed' || task.status === 'cancelled') return task;
      
      if (task.plannedEndDate) {
        const endDate = new Date(task.plannedEndDate);
        endDate.setHours(0, 0, 0, 0);
        
        if (endDate < now && task.status !== 'delayed') {
          return { ...task, status: 'delayed', updatedAt: new Date().toISOString() };
        }
      }
      return task;
    });
  },

  seedTasks: (): Task[] => {
    const tasks: Task[] = [];
    let idCounter = 1;

    // Seed Monthly Tasks
    MONTHLY_TASKS.forEach(title => {
      const props = determineTaskProps(title, 'monthly');
      tasks.push({
        id: `TASK-${idCounter++}`,
        title,
        description: `${title} işlemi için aylık rutin kontrol ve işlem.`,
        category: 'monthly',
        type: 'regular',
        defaultResponsible: 'İK Yöneticisi',
        activeResponsible: 'İK Yöneticisi',
        isRecurring: true,
        recurrencePattern: 'monthly',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...props
      } as Task);
    });

    // Seed One-time Tasks
    ONETIME_TASKS.forEach(title => {
      const props = determineTaskProps(title, 'onetime');
      tasks.push({
        id: `TASK-${idCounter++}`,
        title,
        description: `${title} işlemi için tek seferlik planlama.`,
        category: 'onetime',
        type: 'project',
        defaultResponsible: 'İK Uzmanı',
        activeResponsible: 'İK Uzmanı',
        isRecurring: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...props
      } as Task);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return tasks;
  },

  saveTask: (task: Task, sourceTasks?: Task[]): Task => {
    const tasks = taskService.getTasks(true, sourceTasks);
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    
    let savedTask: Task;
    if (existingIndex >= 0) {
      savedTask = { ...task, updatedAt: new Date().toISOString() };
      tasks[existingIndex] = savedTask;
    } else {
      savedTask = { ...task, id: task.id || `TASK-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      tasks.push(savedTask);
    }
    
    // Handle Recurrence Generation
    if (savedTask.isRecurring && savedTask.plannedStartDate) {
      // If daily, generate for the next 30 days to satisfy user request "hergüne o işi yazması gerekir"
      const occurrencesToGenerate = savedTask.frequency === 'daily' ? 30 : 1;
      let currentTask = savedTask;
      
      for (let i = 0; i < occurrencesToGenerate; i++) {
        const nextTask = generateNextOccurrence(currentTask);
        if (nextTask) {
          const nextDateStr = new Date(nextTask.plannedStartDate!).toDateString();
          const exists = tasks.some(t => 
            t.title === nextTask.title && 
            t.plannedStartDate && 
            new Date(t.plannedStartDate).toDateString() === nextDateStr
          );

          if (!exists) {
            tasks.push(nextTask);
            currentTask = nextTask; // Continue from the new one for next iteration
          } else {
            // If it exists, find it and continue from there to avoid gaps
            const existing = tasks.find(t => 
              t.title === nextTask.title && 
              t.plannedStartDate && 
              new Date(t.plannedStartDate).toDateString() === nextDateStr
            );
            if (existing) currentTask = existing;
            else break;
          }
        } else {
          break;
        }
      }
    }
    
    if (!sourceTasks) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
    return savedTask;
  },

  deleteTask: (id: string, sourceTasks?: Task[]): void => {
    const tasks = taskService.getTasks(true, sourceTasks);
    const updated = tasks.map(t => t.id === id ? { ...t, isDeleted: true, deletedAt: new Date().toISOString() } : t);
    if (!sourceTasks) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  restoreTask: (id: string, sourceTasks?: Task[]): void => {
    const tasks = taskService.getTasks(true, sourceTasks);
    const updated = tasks.map(t => t.id === id ? { ...t, isDeleted: false, deletedAt: undefined } : t);
    if (!sourceTasks) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  permanentDeleteTask: (id: string, sourceTasks?: Task[]): void => {
    const tasks = taskService.getTasks(true, sourceTasks);
    const filtered = tasks.filter(t => t.id !== id);
    if (!sourceTasks) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  },

  getStats: (sourceTasks?: Task[]): TaskStats => {
    const tasks = taskService.getTasks(false, sourceTasks);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Adjust to Monday
    startOfWeek.setHours(0,0,0,0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      delayed: tasks.filter(t => t.status === 'delayed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      planned: tasks.filter(t => t.status === 'planned').length,
      inProgress: tasks.filter(t => t.status === 'in_progress' || t.status === 'started').length,
      critical: tasks.filter(t => t.priority === 'critical').length,
      thisWeek: tasks.filter(t => {
        if (!t.plannedStartDate) return false;
        const d = new Date(t.plannedStartDate);
        return d >= startOfWeek && d <= endOfWeek;
      }).length,
      today: tasks.filter(t => {
        if (!t.plannedStartDate) return false;
        const d = new Date(t.plannedStartDate);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      }).length
    };
  },

  getWeeklyDistribution: (sourceTasks?: Task[]) => {
    const tasks = taskService.getTasks(false, sourceTasks);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0,0,0,0);

    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const distribution = days.map((name, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      const dayStart = new Date(dayDate);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23,59,59,999);

      const dayTasks = tasks.filter(t => {
        if (!t.plannedStartDate) return false;
        const d = new Date(t.plannedStartDate);
        return d >= dayStart && d <= dayEnd;
      });

      return {
        name,
        completed: dayTasks.filter(t => t.status === 'completed').length,
        pending: dayTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
        delayed: dayTasks.filter(t => t.status === 'delayed').length
      };
    });

    return distribution;
  },

  getMonthlyTrend: (sourceTasks?: Task[]) => {
    const tasks = taskService.getTasks(false, sourceTasks);
    const now = new Date();
    const weeks = [];
    
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i * 7 + now.getDay() - 1));
      start.setHours(0,0,0,0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);

      const weekTasks = tasks.filter(t => {
        if (!t.plannedStartDate) return false;
        const d = new Date(t.plannedStartDate);
        return d >= start && d <= end;
      });

      const completed = weekTasks.filter(t => t.status === 'completed').length;
      const total = weekTasks.length;
      const verimlilik = total > 0 ? Math.round((completed / total) * 100) : 0;

      weeks.push({
        name: `${4-i}. Hafta`,
        verimlilik,
        completed,
        total
      });
    }

    return weeks;
  },

  getTodayTasks: (sourceTasks?: Task[]) => {
    const tasks = taskService.getTasks(false, sourceTasks);
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return tasks.filter(t => {
      if (!t.plannedStartDate) return false;
      const d = new Date(t.plannedStartDate);
      return d >= today && d < tomorrow && !t.isDeleted;
    });
  },

  getResponsibleStats: (sourceTasks?: Task[]) => {
    const tasks = taskService.getTasks(false, sourceTasks);
    const responsibles = taskService.getSettings().responsibles;
    
    return responsibles.map(name => {
      const respTasks = tasks.filter(t => t.activeResponsible === name);
      const completed = respTasks.filter(t => t.status === 'completed').length;
      const total = respTasks.length;
      
      return {
        name,
        completed,
        total,
        performance: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }).sort((a, b) => b.performance - a.performance);
  },
  
  // Settings
  getSettings: () => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      responsibles: ['Emir Gündoğdu', 'Nurullah Çakmak', 'İK Yöneticisi', 'İK Uzmanı'],
      notificationTimes: ['09:00', '13:00', '16:00'],
      defaultWarningDays: 2
    };
  },
  
  saveSettings: (settings: any) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  resetData: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};
