/**
 * Framer Motion Animation Variants & Micro-Interaction Presets.
 */

export const fadeInVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const slideUpVariant = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 15 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export const modalScaleVariant = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const drawerSlideVariant = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: '100%' },
  transition: { type: 'spring', damping: 25, stiffness: 200 },
};

export const staggerContainerVariant = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerChildItemVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};
