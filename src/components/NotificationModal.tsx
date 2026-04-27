import React, { useState } from 'react';
import { Employee, NotificationRecord, NotificationConfig } from '../types';
import { X, Send } from 'lucide-react';

interface NotificationModalProps {
  employee: Employee;
  draft: Partial<NotificationRecord>;
  config: NotificationConfig;
  onSend: (record: NotificationRecord) => void;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ employee, draft, config, onSend, onClose }) => {
  const [content, setContent] = useState(draft.body || '');

  const handleSend = () => {
    const record: NotificationRecord = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: employee.id,
      month: draft.month || new Date().toISOString().slice(0, 7),
      subject: draft.subject || 'Puantaj Kesinti Bildirimi',
      body: content,
      sentAt: new Date().toISOString(),
      status: 'sent',
      channels: ['email']
    };
    onSend(record);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-start p-4 pt-10">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-bold text-slate-800">Bildirim Gönder</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-48 p-4 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
          />
        </div>
        <div className="p-6 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors">İptal</button>
          <button onClick={handleSend} className="px-6 py-2.5 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-lg shadow-lg flex items-center gap-2">
            <Send className="w-4 h-4" /> Gönder
          </button>
        </div>
      </div>
    </div>
  );
};
