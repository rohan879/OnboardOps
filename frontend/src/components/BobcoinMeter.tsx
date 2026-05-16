'use client';

import { motion } from 'framer-motion';
import { Coins, TrendingUp, AlertTriangle } from 'lucide-react';

interface BobcoinMeterProps {
  totalBudget?: number;
  spent?: number;
  projected?: number;
  className?: string;
}

export function BobcoinMeter({
  totalBudget = 200,
  spent = 0,
  projected = 0,
  className = '',
}: BobcoinMeterProps) {
  const spentPercentage = (spent / totalBudget) * 100;
  const projectedPercentage = (projected / totalBudget) * 100;

  // Determine status color
  const getStatusColor = () => {
    if (projectedPercentage > 90) return 'text-red-60';
    if (projectedPercentage > 75) return 'text-orange-60';
    return 'text-green-60';
  };

  const getBarColor = () => {
    if (projectedPercentage > 90) return 'bg-red-60';
    if (projectedPercentage > 75) return 'bg-orange-60';
    return 'bg-ibm-blue-60';
  };

  return (
    <div className={`bg-white rounded-lg border border-ibm-gray-20 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-ibm-blue-60" />
          <h3 className="text-sm font-semibold text-ibm-gray-100">
            Bobcoin Budget
          </h3>
        </div>
        {projectedPercentage > 75 && (
          <AlertTriangle className={`w-4 h-4 ${getStatusColor()}`} />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-ibm-gray-10 rounded-full overflow-hidden">
          {/* Spent portion */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${spentPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-ibm-gray-70 float-left"
          />
          {/* Projected portion */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${projectedPercentage - spentPercentage}%` }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className={`h-full ${getBarColor()} float-left opacity-50`}
          />
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-ibm-gray-70 rounded-sm" />
            <span className="text-ibm-gray-70">Spent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 ${getBarColor()} opacity-50 rounded-sm`} />
            <span className="text-ibm-gray-70">Projected</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-xs text-ibm-gray-50 mb-1">Spent</div>
          <div className="text-lg font-bold text-ibm-gray-100">{spent}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-ibm-gray-50 mb-1">Projected</div>
          <div className={`text-lg font-bold ${getStatusColor()}`}>
            {projected}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-ibm-gray-50 mb-1">Remaining</div>
          <div className="text-lg font-bold text-ibm-gray-100">
            {Math.max(0, totalBudget - projected)}
          </div>
        </div>
      </div>

      {/* Warning message */}
      {projectedPercentage > 90 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 bg-red-10 border border-red-30 rounded text-xs text-red-70"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>Budget nearly exhausted! Consider optimizing queries.</span>
          </div>
        </motion.div>
      )}

      {projectedPercentage > 75 && projectedPercentage <= 90 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 bg-orange-10 border border-orange-30 rounded text-xs text-orange-70"
        >
          <div className="flex items-start gap-2">
            <TrendingUp className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>Approaching budget limit. Monitor usage carefully.</span>
          </div>
        </motion.div>
      )}

      {/* Budget info */}
      <div className="mt-3 pt-3 border-t border-ibm-gray-10">
        <div className="text-xs text-ibm-gray-50 text-center">
          Total Budget: {totalBudget} Bobcoins
        </div>
      </div>
    </div>
  );
}

// Made with Bob