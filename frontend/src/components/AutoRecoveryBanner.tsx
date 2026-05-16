'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export type RecoveryPattern = 
  | 'port-in-use' 
  | 'node-version' 
  | 'missing-venv' 
  | 'missing-seed' 
  | 'db-not-running';

export type RecoveryStatus = 'in-progress' | 'success' | 'failed';

export interface RecoveryEvent {
  pattern: RecoveryPattern;
  action: string;
  details: string;
  status: RecoveryStatus;
  timestamp: string;
}

interface AutoRecoveryBannerProps {
  event: RecoveryEvent | null;
  onDismiss?: () => void;
}

const patternLabels: Record<RecoveryPattern, string> = {
  'port-in-use': 'Port In Use',
  'node-version': 'Node Version Mismatch',
  'missing-venv': 'Missing Virtual Environment',
  'missing-seed': 'Missing Seed Data',
  'db-not-running': 'Database Not Running',
};

const statusConfig = {
  'in-progress': {
    icon: Loader2,
    bgColor: 'bg-ibm-blue-60',
    textColor: 'text-white',
    iconClass: 'animate-spin',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-ibm-green-50',
    textColor: 'text-white',
    iconClass: '',
  },
  failed: {
    icon: XCircle,
    bgColor: 'bg-ibm-red-50',
    textColor: 'text-white',
    iconClass: '',
  },
};

export function AutoRecoveryBanner({ event, onDismiss }: AutoRecoveryBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setIsVisible(true);

      // Auto-dismiss after delay
      const dismissDelay = event.status === 'success' ? 4000 : 8000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          onDismiss?.();
        }, 300); // Wait for exit animation
      }, dismissDelay);

      return () => clearTimeout(timer);
    }
  }, [event, onDismiss]);

  if (!event) return null;

  const config = statusConfig[event.status];
  const Icon = config.icon;
  const patternLabel = patternLabels[event.pattern];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
        >
          <div
            className={`${config.bgColor} ${config.textColor} rounded-lg shadow-2xl max-w-2xl w-full`}
          >
            <div className="px-6 py-4 flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`w-6 h-6 ${config.iconClass}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">
                    {patternLabel}
                  </h3>
                  {event.status === 'in-progress' && (
                    <span className="text-xs opacity-90">Recovering...</span>
                  )}
                  {event.status === 'success' && (
                    <span className="text-xs opacity-90">Resolved</span>
                  )}
                  {event.status === 'failed' && (
                    <span className="text-xs opacity-90">Failed</span>
                  )}
                </div>

                {/* Action description */}
                <p className="text-sm opacity-95 font-mono">
                  {event.action}
                </p>

                {/* Details */}
                {event.details && (
                  <p className="text-xs opacity-80 mt-1">
                    {event.details}
                  </p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onDismiss?.(), 300);
                }}
                className="flex-shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Success celebration animation */}
            {event.status === 'success' && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-1 bg-white/30 origin-left"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage recovery events
export function useAutoRecovery() {
  const [currentEvent, setCurrentEvent] = useState<RecoveryEvent | null>(null);

  const showRecovery = (event: RecoveryEvent) => {
    setCurrentEvent(event);
  };

  const dismissRecovery = () => {
    setCurrentEvent(null);
  };

  return {
    currentEvent,
    showRecovery,
    dismissRecovery,
  };
}

// Made with Bob