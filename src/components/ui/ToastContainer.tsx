'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '@/lib/store';

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-white border-emerald-500 text-gray-900';
        let icon = <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;

        if (toast.type === 'error') {
          bg = 'bg-white border-red-500 text-gray-900';
          icon = <AlertCircle className="w-5 h-5 text-brand-500 shrink-0" />;
        } else if (toast.type === 'info') {
          bg = 'bg-white border-blue-500 text-gray-900';
          icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border-l-4 border ${bg} flex items-start justify-between space-x-3 animate-slide-down`}
          >
            <div className="flex items-start space-x-3">
              {icon}
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
