'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Hook to detect demo mode and provide animation timing multiplier
 * 
 * Demo mode slows animations for video recording:
 * - Card emissions: 200ms → 350ms
 * - Grade fills: 400ms → 600ms
 * - Recovery banner: 4s → 5s
 * 
 * Usage: http://localhost:3000?demo=true
 */
export function useDemoMode() {
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get('demo') === 'true';
  
  return {
    isDemoMode,
    // Multiply all animation durations by this factor
    animationMultiplier: isDemoMode ? 1.75 : 1.0,
  };
}

// Made with Bob
