'use client';

import { motion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cardVariants } from '@/components/animations';

export type CardType = 'graph' | 'entry' | 'hotspot' | 'convention';
export type CardState = 'pending' | 'in-progress' | 'complete' | 'error';

interface CartographyCardProps {
  type: CardType;
  title: string;
  state: CardState;
  children?: ReactNode;
  error?: string;
}

const cardTypeConfig = {
  graph: {
    label: 'Dependency Graph',
    color: 'ibm-blue-60',
  },
  entry: {
    label: 'Entry Points',
    color: 'ibm-purple-50',
  },
  hotspot: {
    label: 'Change Hotspots',
    color: 'ibm-orange-40',
  },
  convention: {
    label: 'Project Conventions',
    color: 'ibm-green-50',
  },
};

const stateConfig = {
  pending: {
    icon: Clock,
    bgColor: 'bg-ibm-gray-10',
    borderColor: 'border-ibm-gray-70',
    textColor: 'text-ibm-gray-70',
  },
  'in-progress': {
    icon: Loader2,
    bgColor: 'bg-ibm-blue-60/5',
    borderColor: 'border-ibm-blue-60',
    textColor: 'text-ibm-blue-60',
  },
  complete: {
    icon: CheckCircle,
    bgColor: 'bg-ibm-green-50/5',
    borderColor: 'border-ibm-green-50',
    textColor: 'text-ibm-green-50',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-ibm-red-50/5',
    borderColor: 'border-ibm-red-50',
    textColor: 'text-ibm-red-50',
  },
};

export function CartographyCard({
  type,
  title,
  state,
  children,
  error,
}: CartographyCardProps) {
  const config = cardTypeConfig[type];
  const stateStyle = stateConfig[state];
  const StateIcon = stateStyle.icon;
  
  // Track when card transitions to complete for story-beat glow
  const [showStoryBeatGlow, setShowStoryBeatGlow] = useState(false);
  
  useEffect(() => {
    if (state === 'complete' && type === 'graph') {
      setShowStoryBeatGlow(true);
      // Auto-hide after animation completes
      const timer = setTimeout(() => setShowStoryBeatGlow(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [state, type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={state}
      variants={cardVariants}
      className={`rounded-lg border-2 ${stateStyle.borderColor} ${stateStyle.bgColor} overflow-hidden relative`}
    >
      {/* Story-beat glow for dependency graph completion */}
      {showStoryBeatGlow && type === 'graph' && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          initial={{ boxShadow: '0 0 0px rgba(15, 98, 254, 0)' }}
          animate={{
            boxShadow: [
              '0 0 0px rgba(15, 98, 254, 0)',
              '0 0 30px rgba(15, 98, 254, 0.4)',
              '0 0 0px rgba(15, 98, 254, 0)',
            ],
          }}
          transition={{ duration: 1.5 }}
        />
      )}
      
      {/* Shimmer effect for in-progress state */}
      {state === 'in-progress' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(15, 98, 254, 0.08) 50%, transparent 100%)',
            backgroundSize: '1000px 100%',
            animation: 'shimmer 2s infinite linear',
          }}
        />
      )}
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-ibm-gray-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={state === 'in-progress' ? { rotate: 360 } : {}}
            transition={{
              duration: 2,
              repeat: state === 'in-progress' ? Infinity : 0,
              ease: 'linear',
            }}
          >
            <StateIcon className={`w-5 h-5 ${stateStyle.textColor}`} />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-ibm-gray-100">{title}</h3>
            <p className="text-xs text-ibm-gray-70">{config.label}</p>
          </div>
        </div>
        <div className={`text-xs font-medium uppercase tracking-wide ${stateStyle.textColor}`}>
          {state.replace('-', ' ')}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        {state === 'error' && error ? (
          <div className="text-sm text-ibm-red-50 bg-ibm-red-50/10 rounded p-4">
            <p className="font-semibold mb-1">Error</p>
            <p>{error}</p>
          </div>
        ) : state === 'pending' ? (
          <div className="text-center py-8 text-ibm-gray-70 text-sm">
            Waiting to start...
          </div>
        ) : state === 'in-progress' && !children ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-ibm-blue-60 animate-spin" />
            <span className="ml-3 text-ibm-gray-70">Processing...</span>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

// Made with Bob
