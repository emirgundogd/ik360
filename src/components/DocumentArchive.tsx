import React from 'react';
import { DocumentRecord, Employee } from '../types';

interface Props {
  documents: DocumentRecord[];
  employees: Employee[];
  onDelete: (id: string) => void;
  onView: (doc: DocumentRecord) => void;
}

export const DocumentArchive: React.FC<Props> = () => {
  return <div>DocumentArchive</div>;
};
