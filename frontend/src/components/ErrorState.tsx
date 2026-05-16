'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  severity?: 'error' | 'warning';
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  severity = 'error',
  className = '',
}: ErrorStateProps) {
  const Icon = severity === 'error' ? XCircle : AlertCircle;
  const iconColor = severity === 'error' ? 'text-red-60' : 'text-orange-60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center gap-4 p-6 ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <Icon className={`w-12 h-12 ${iconColor}`} />
      </motion.div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-ibm-gray-100">{title}</h3>
        <p className="text-sm text-ibm-gray-70 max-w-md">{message}</p>
      </div>

      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-ibm-blue-60 text-white rounded hover:bg-ibm-blue-70 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

// Inline error banner for smaller spaces
export function ErrorBanner({
  message,
  onDismiss,
  severity = 'error',
  className = '',
}: {
  message: string;
  onDismiss?: () => void;
  severity?: 'error' | 'warning';
  className?: string;
}) {
  const Icon = severity === 'error' ? XCircle : AlertCircle;
  const bgColor = severity === 'error' ? 'bg-red-10' : 'bg-orange-10';
  const borderColor = severity === 'error' ? 'border-red-30' : 'border-orange-30';
  const textColor = severity === 'error' ? 'text-red-70' : 'text-orange-70';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 p-3 ${bgColor} border ${borderColor} rounded-lg ${className}`}
    >
      <Icon className={`w-5 h-5 ${textColor} flex-shrink-0 mt-0.5`} />
      <p className={`text-sm ${textColor} flex-1`}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`${textColor} hover:opacity-70 transition-opacity`}
          aria-label="Dismiss"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// Empty state for when there's no data
export function EmptyState({
  icon: Icon = AlertCircle,
  title = 'No data available',
  message,
  action,
  actionLabel,
  className = '',
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  message?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center gap-4 p-8 text-center ${className}`}
    >
      <Icon className="w-12 h-12 text-ibm-gray-50" />
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-ibm-gray-70">{title}</h3>
        {message && <p className="text-sm text-ibm-gray-50 max-w-sm">{message}</p>}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-ibm-blue-60 text-white rounded hover:bg-ibm-blue-70 transition-colors text-sm font-medium"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}

// Made with Bob