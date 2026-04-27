
import { AppState, User, ColumnConfig } from '../types';

// Dinamik API URL Tespiti:
const API_BASE_URL = '/api';

const getHeaders = () => {
  let token = null;
  try {
    token = localStorage.getItem('AUTH_TOKEN');
  } catch (e) {
    console.error('Failed to get token', e);
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const api = {
  // --- AUTHENTICATION ---
  login: async (username: string, password: string): Promise<{ token: string, user: User }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Giriş yapılamadı');
      }

      return await response.json();
    } catch (error: any) {
      // Eğer sunucuya hiç ulaşılamazsa (Network Error) - Çevrimdışı/Geliştirme Modu Erişimi
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        console.warn("Sunucu erişilemiyor. Çevrimdışı modda giriş yapılıyor.");
        return {
          token: 'offline-dev-token',
          user: {
            id: 'dev-admin',
            username: username || 'admin',
            role: 'ADMIN',
            isActive: true,
            mustChangePassword: false,
            createdAt: new Date().toISOString()
          }
        };
      }
      throw error;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Şifre değiştirilemedi');
    }
  },

  // --- DATA SYNCHRONIZATION ---
  getState: async (): Promise<{ data: AppState | null, version: number }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        // Token süresi dolmuş olabilir veya sunucu hatası
        if (response.status === 401) throw new Error('AUTH_REQUIRED');
        throw new Error('Veri çekilemedi');
      }

      return await response.json();
    } catch (error: any) {
      // Sunucu kapalıysa null döndür, Persistence servisi LocalStorage'a düşsün
      console.warn("API Error (getState):", error);
      // throw error yerine null dönerek local fallback'i tetikleyelim
      return { data: null, version: 0 };
    }
  },

  saveState: async (state: AppState, version: number): Promise<{ success: boolean, version: number }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ data: state, version })
      });

      if (response.status === 409) {
        throw new Error('VERSION_CONFLICT');
      }

      if (!response.ok) {
        throw new Error('Kaydetme başarısız');
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        // Sunucu yoksa hata fırlat, UI 'offline' durumuna geçsin
        throw error;
      }
      throw error;
    }
  },

  // --- USER MANAGEMENT (ADMIN) ---
  getUsers: async (): Promise<User[]> => {
    console.log("[ik360-API] Fetching users from server...");
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("[ik360-API] Fetch users failed:", err);
      throw new Error(err.error || 'Kullanıcı listesi alınamadı');
    }
    const data = await response.json();
    console.log("[ik360-API] Received users from server:", data);
    return data;
  },

  createUser: async (user: any): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(user)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Kullanıcı oluşturulamadı');
    }
  },

  updateUser: async (id: string, data: any): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Kullanıcı güncellenemedi');
  },

  deleteUser: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Kullanıcı silinemedi');
  },

  // --- PREFERENCES (LocalStorage Only for UI Speed) ---
  getTablePreferences: async (tableId: string): Promise<ColumnConfig[] | null> => {
    try {
      const raw = localStorage.getItem(`TABLE_PREFS_${tableId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  saveTablePreferences: async (tableId: string, config: ColumnConfig[]): Promise<void> => {
    try {
      localStorage.setItem(`TABLE_PREFS_${tableId}`, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save table preferences', e);
    }
  }
};
