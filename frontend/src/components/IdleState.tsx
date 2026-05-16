'use client';

import { motion } from 'framer-motion';

/**
 * IdleState component shown when dashboard is waiting for onboarding to begin
 * 
 * Features:
 * - Centered OnboardOps wordmark with pulsing animation
 * - Waiting message
 * - Animated progress bar
 * 
 * Prevents blank/broken appearance during idle periods
 */
export function IdleState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full min-h-[400px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Pulsing wordmark */}
      <motion.div
        className="text-6xl font-bold text-ibm-blue-60 mb-4"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        OnboardOps
      </motion.div>
      
      {/* Waiting message */}
      <p className="text-ibm-gray-70 text-lg mb-2">
        Waiting for onboarding to begin...
      </p>
      
      <p className="text-ibm-gray-50 text-sm">
        Run <code className="px-2 py-1 bg-ibm-gray-10 rounded font-mono">/onboard</code> in Bob IDE to start
      </p>
      
      {/* Animated progress bar */}
      <motion.div
        className="mt-8 w-64 h-1 bg-ibm-gray-20 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-ibm-blue-60 rounded-full"
          animate={{ 
            x: ['-100%', '100%'],
            scaleX: [0.3, 1, 0.3]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    </motion.div>
  );
}

// Made with Bob
