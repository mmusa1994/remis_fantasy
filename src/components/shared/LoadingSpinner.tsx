'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = React.memo<LoadingSpinnerProps>(function LoadingSpinner({ size = 'md', className = '' }) {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <div className={`w-full h-full rounded-full border-2 border-transparent ${
        theme === 'dark' 
          ? 'border-t-white border-r-white/30' 
          : 'border-t-black border-r-black/30'
      }`} />
    </motion.div>
  );
});

export default LoadingSpinner;