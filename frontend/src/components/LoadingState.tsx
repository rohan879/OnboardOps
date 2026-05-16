'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className = '' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizeClasses[size]} text-ibm-blue-60`} />
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${textSizeClasses[size]} text-ibm-gray-70 text-center`}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

// Skeleton loader for content placeholders
export function SkeletonLoader({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            delay: i * 0.1 
          }}
          className="h-4 bg-ibm-gray-20 rounded"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

// Shimmer effect for cards
export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-ibm-gray-20 p-6 ${className}`}>
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-ibm-gray-20 rounded w-1/3" />
        <div className="space-y-3">
          <div className="h-4 bg-ibm-gray-20 rounded" />
          <div className="h-4 bg-ibm-gray-20 rounded w-5/6" />
          <div className="h-4 bg-ibm-gray-20 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

// Made with Bob