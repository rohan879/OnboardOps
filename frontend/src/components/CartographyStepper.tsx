'use client';

import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

export type StepStatus = 'pending' | 'in-progress' | 'complete' | 'error';

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

interface CartographyStepperProps {
  steps: Step[];
  className?: string;
}

export function CartographyStepper({ steps, className = '' }: CartographyStepperProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${
                  step.status === 'complete'
                    ? 'bg-ibm-blue-60 border-ibm-blue-60'
                    : step.status === 'in-progress'
                    ? 'bg-white border-ibm-blue-60'
                    : step.status === 'error'
                    ? 'bg-white border-red-60'
                    : 'bg-white border-ibm-gray-30'
                }
              `}
            >
              {step.status === 'complete' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
              )}
              {step.status === 'in-progress' && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-5 h-5 text-ibm-blue-60" />
                </motion.div>
              )}
              {step.status === 'error' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <span className="text-red-60 font-bold">!</span>
                </motion.div>
              )}
              {step.status === 'pending' && (
                <div className="w-3 h-3 rounded-full bg-ibm-gray-30" />
              )}
            </motion.div>

            {/* Step Label */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.1 }}
              className={`
                mt-2 text-xs font-medium text-center whitespace-nowrap
                ${
                  step.status === 'complete' || step.status === 'in-progress'
                    ? 'text-ibm-gray-100'
                    : step.status === 'error'
                    ? 'text-red-60'
                    : 'text-ibm-gray-50'
                }
              `}
            >
              {step.label}
            </motion.div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-4 relative">
              <div className="absolute inset-0 bg-ibm-gray-20" />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: step.status === 'complete' ? 1 : 0,
                }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                className="absolute inset-0 bg-ibm-blue-60 origin-left"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Default 4-stage cartography steps
export const DEFAULT_CARTOGRAPHY_STEPS: Step[] = [
  { id: 'graph', label: 'Dependency Graph', status: 'pending' },
  { id: 'entry', label: 'Entry Points', status: 'pending' },
  { id: 'hotspot', label: 'Change Hotspots', status: 'pending' },
  { id: 'convention', label: 'Conventions', status: 'pending' },
];

// Made with Bob