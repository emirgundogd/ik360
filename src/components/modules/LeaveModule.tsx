import React from 'react';
import { Employee, LeaveRecord, LeaveSettings } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

import { LeaveDashboard } from '../leave/LeaveDashboard';
import { LeaveImport } from '../leave/LeaveImport';
import { LeaveData } from '../leave/LeaveData';
import { LeaveAnalytics } from '../leave/LeaveAnalytics';
import { LeaveCostReport } from '../leave/LeaveCostReport';
import { LeaveManagerReports } from '../leave/LeaveManagerReports';
import { LeaveRiskAnalysis } from '../leave/LeaveRiskAnalysis';
import { LeaveSettingsPanel } from '../leave/LeaveSettingsPanel';

interface Props {
  employees: Employee[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  leaveData: LeaveRecord[];
  setLeaveData: (data: LeaveRecord[]) => void;
  settings: LeaveSettings;
  setSettings: (settings: LeaveSettings) => void;
}

export const LeaveModule: React.FC<Props> = ({ 
  employees, 
  activeTab, 
  onTabChange,
  leaveData,
  setLeaveData,
  settings,
  setSettings
}) => {
  const handleImportData = (newData: LeaveRecord[]) => {
    setLeaveData(newData);
    onTabChange('data');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <LeaveDashboard data={leaveData} settings={settings} />;
      case 'import':
        return <LeaveImport onImport={handleImportData} employees={employees} />;
      case 'data':
        return <LeaveData data={leaveData} settings={settings} />;
      case 'analytics':
        return <LeaveAnalytics data={leaveData} settings={settings} />;
      case 'cost':
        return <LeaveCostReport data={leaveData} settings={settings} />;
      case 'manager':
        return <LeaveManagerReports data={leaveData} settings={settings} employees={employees} />;
      case 'risk':
        return <LeaveRiskAnalysis data={leaveData} settings={settings} />;
      case 'settings':
        return <LeaveSettingsPanel settings={settings} onUpdateSettings={setSettings} />;
      default:
        return <LeaveDashboard data={leaveData} settings={settings} />;
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
