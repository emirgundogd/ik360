import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Globe, 
  RefreshCw,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { UserManagement } from './UserManagement';
import { ConfigPanel } from './ConfigPanel';
import { BackupManager } from './BackupManager';
import { TrashBin } from './TrashBin';
import { AppConfig, Department, Title, DepartmentManager, BackupConfig, Employee, DocumentRecord, NotificationRecord } from '../types';

interface Props {
  activeTab: string;
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onResetConfig: () => void;
  userRole?: string;
  departments: string[];
  titles: string[];
  managers: DepartmentManager[];
  onUpdateDepartments: (deps: string[]) => void;
  onUpdateTitles: (titles: string[]) => void;
  onUpdateManagers: (managers: DepartmentManager[]) => void;
  onSoftDeleteManager: (id: string) => void;
  backupConfig: BackupConfig;
  onBackupConfigChange: (config: BackupConfig) => void;
  onForceBackup: () => void;
  onRestore: (data: any) => void;
  lastBackupTime: number;
  currentAppState: any;
  deletedEmployees: Employee[];
  deletedDocuments: DocumentRecord[];
  deletedNotifications: NotificationRecord[];
  deletedManagers: DepartmentManager[];
  onRestoreDeleted: (id: string, type: 'personnel' | 'document' | 'notification' | 'manager') => void;
  onPermanentDelete: (id: string, type: 'personnel' | 'document' | 'notification' | 'manager') => void;
  onClearTrash: () => void;
}

export const SystemSettings: React.FC<Props> = ({ 
  activeTab,
  config, onConfigChange, onResetConfig, userRole,
  departments, titles, managers, onUpdateDepartments, onUpdateTitles, onUpdateManagers, onSoftDeleteManager,
  backupConfig, onBackupConfigChange, onForceBackup, onRestore, lastBackupTime, currentAppState,
  deletedEmployees, deletedDocuments, deletedNotifications, deletedManagers, onRestoreDeleted,
  onPermanentDelete, onClearTrash
}) => {

  if (userRole !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Yetki Yetersiz</h3>
        <p className="text-slate-500 font-medium mt-2">Bu bölüme erişmek için yönetici yetkisine sahip olmanız gerekmektedir.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 rounded-3xl border border-slate-200">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Sistem Yönetimi</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Platform genel yapılandırması ve kullanıcı yönetimi</p>
        </div>
        {activeTab === 'general' && (
          <div className="space-y-8">
            <ConfigPanel config={config} onConfigChange={onConfigChange} onReset={onResetConfig} />
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-500" />
                Bölgesel Ayarlar
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Varsayılan Dil</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold">
                    <option value="tr">Türkçe (TR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Zaman Dilimi</label>
                  <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-brand-500 outline-none transition-all font-bold">
                    <option value="UTC+3">(UTC+03:00) İstanbul</option>
                    <option value="UTC+0">(UTC+00:00) London</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'backup' && (
          <BackupManager 
            config={backupConfig} 
            onConfigChange={onBackupConfigChange} 
            onForceBackup={onForceBackup} 
            onRestore={onRestore} 
            lastBackupTime={lastBackupTime} 
            currentAppState={currentAppState} 
          />
        )}

        {activeTab === 'trash' && (
          <TrashBin 
            deletedEmployees={deletedEmployees} 
            deletedDocuments={deletedDocuments} 
            deletedNotifications={deletedNotifications} 
            deletedManagers={deletedManagers} 
            employees={[]} 
            onRestore={onRestoreDeleted} 
            onPermanentDelete={onPermanentDelete} 
            onClearAll={onClearTrash} 
          />
        )}
      </div>
    </div>
  );
};
