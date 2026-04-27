import React from 'react';
import { Employee, MonthlyResult, DepartmentManager, AppConfig, ManagerMessageTemplate } from '../types';

interface Props {
  employees: Employee[];
  results: Record<string, MonthlyResult>;
  currentMonth: string;
  managers: DepartmentManager[];
  config: AppConfig;
  templates: ManagerMessageTemplate[];
}

export const ManagerNotificationCenter: React.FC<Props> = () => {
  return <div>ManagerNotificationCenter</div>;
};
