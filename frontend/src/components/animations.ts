import type { TargetAndTransition, Transition, Variants } from 'framer-motion';

export const cardVariants: Variants = {
  pending: {
    opacity: 0.75,
    y: 0,
    scale: 0.995,
  },
  'in-progress': {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: '0 8px 24px rgba(15, 98, 254, 0.12)',
  },
  complete: {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: '0 4px 16px rgba(36, 161, 72, 0.10)',
  },
  error: {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: '0 4px 16px rgba(218, 30, 40, 0.12)',
  },
};

type GradeAnimation = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
};

export const gradeAnimations: Record<'pass' | 'partial' | 'fail', GradeAnimation> = {
  pass: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 1.1, 1],
      opacity: 1,
      boxShadow: [
        '0 0 0px rgba(36, 161, 72, 0)',
        '0 0 20px rgba(36, 161, 72, 0.4)',
        '0 0 0px rgba(36, 161, 72, 0)',
      ],
    },
    transition: { duration: 0.5, times: [0, 0.7, 1] },
  },
  partial: {
    initial: { scale: 0, opacity: 0, rotate: -10 },
    animate: {
      scale: [1, 1.05, 1],
      opacity: 1,
      rotate: 0,
    },
    transition: { type: 'spring' as const, stiffness: 300, damping: 15 },
  },
  fail: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      x: [-4, 4, -4, 4, 0],
    },
    transition: { duration: 0.4 },
  },
};

export const celebrationVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 16,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: {
      duration: 0.18,
    },
  },
};
