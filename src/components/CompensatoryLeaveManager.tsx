import React from 'react';
import { Employee, MonthlyInput } from '../types';

interface Props {
  employees: Employee[];
  inputs: Record<string, MonthlyInput>;
  currentMonth: string;
  onUpdateInitialLeave: () => void;
  onUpdateMonthOverride: () => void;
}

export const CompensatoryLeaveManager: React.FC<Props> = () => {
  return <div>CompensatoryLeaveManager</div>;
};
