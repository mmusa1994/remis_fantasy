import React from 'react';
import SkeletonBase from './SkeletonBase';

interface SkeletonButtonProps {
  /** Button width */
  width?: string | number;
  /** Button height */
  height?: string | number;
  /** Button size preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'icon';
  /** Whether to show an icon placeholder */
  showIcon?: boolean;
  /** Custom className */
  className?: string;
  /** Whether button should be full width */
  fullWidth?: boolean;
}

/**
 * Skeleton component for buttons in loading states
 */
export default function SkeletonButton({
  width,
  height,
  size = 'md',
  variant = 'default',
  showIcon = false,
  className = '',
  fullWidth = false,
}: SkeletonButtonProps) {
  // Get size presets
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { width: width || '4rem', height: height || '1.5rem' };
      case 'md':
        return { width: width || '6rem', height: height || '2rem' };
      case 'lg':
        return { width: width || '8rem', height: height || '2.5rem' };
      case 'xl':
        return { width: width || '10rem', height: height || '3rem' };
      default:
        return { width: width || '6rem', height: height || '2rem' };
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'shadow-md';
      case 'secondary':
        return 'border border-gray-300 dark:border-gray-600';
      case 'icon':
        return 'rounded-full';
      default:
        return '';
    }
  };

  const dimensions = getSizeClasses();
  const buttonWidth = fullWidth ? '100%' : dimensions.width;
  const buttonHeight = dimensions.height;

  if (showIcon) {
    return (
      <div className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}>
        <SkeletonBase
          width="1.5rem"
          height="1.5rem"
          rounded={variant === 'icon' ? 'full' : 'md'}
        />
        {variant !== 'icon' && (
          <SkeletonBase
            width={typeof buttonWidth === 'string' && buttonWidth !== '100%' ? 'calc(100% - 2.5rem)' : '4rem'}
            height={buttonHeight}
            rounded="md"
            className={getVariantClasses()}
          />
        )}
      </div>
    );
  }

  return (
    <SkeletonBase
      width={buttonWidth}
      height={buttonHeight}
      rounded={variant === 'icon' ? 'full' : 'md'}
      className={`${getVariantClasses()} ${className}`}
    />
  );
}