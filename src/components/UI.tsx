import React from 'react';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
  };
}

export const PageHeader: React.FC<HeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.icon || <Plus size={18} />}
          {action.label}
        </button>
      )}
    </div>
  );
};

interface LoadingProps {
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ fullScreen = false }) => {
  const content = (
    <div className="flex items-center justify-center gap-2">
      <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce" />
      <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.1s' }} />
      <div className="w-4 h-4 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        {content}
      </div>
    );
  }

  return <div className="flex justify-center py-8">{content}</div>;
};

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start justify-between">
      <div className="text-sm text-red-800">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-700 font-semibold text-sm ml-4"
        >
          Descartar
        </button>
      )}
    </div>
  );
};

interface SuccessAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({ message, onDismiss }) => {
  return (
    <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start justify-between">
      <div className="text-sm text-green-800">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-700 font-semibold text-sm ml-4"
        >
          Descartar
        </button>
      )}
    </div>
  );
};
