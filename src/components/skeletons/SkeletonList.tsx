import React from 'react';
import SkeletonBase from './SkeletonBase';

interface SkeletonListProps {
  /** Number of list items to show */
  items?: number;
  /** Whether to show icons in list items */
  showIcons?: boolean;
  /** Whether to show avatars in list items */
  showAvatars?: boolean;
  /** Whether to show secondary text */
  showSecondaryText?: boolean;
  /** Whether to show actions/badges */
  showActions?: boolean;
  /** List variant */
  variant?: 'default' | 'events' | 'notifications' | 'compact';
  /** Custom className for the container */
  className?: string;
  /** Whether to show list header */
  showHeader?: boolean;
  /** List title */
  title?: string;
}

/**
 * Skeleton component for lists (live ticker events, notifications, etc.)
 */
export default function SkeletonList({
  items = 5,
  showIcons = true,
  showAvatars = false,
  showSecondaryText = true,
  showActions = false,
  variant = 'default',
  className = '',
  showHeader = false,
  title,
}: SkeletonListProps) {
  const getContainerClasses = () => {
    switch (variant) {
      case 'events':
        return 'bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-lg shadow border border-amber-200 dark:border-gray-800';
      case 'notifications':
        return 'bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-lg shadow-sm border border-amber-300 dark:border-gray-800';
      case 'compact':
        return 'space-y-2';
      default:
        return 'bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-lg shadow-sm border border-amber-200 dark:border-gray-800';
    }
  };

  const getItemClasses = () => {
    switch (variant) {
      case 'events':
        return 'flex items-start space-x-3 py-3 border-b border-amber-200 dark:border-gray-800 last:border-b-0 hover:bg-gradient-to-r hover:from-amber-75 hover:to-orange-75 dark:hover:bg-gray-800';
      case 'compact':
        return 'flex items-center space-x-3 p-2 rounded-md bg-gradient-to-r from-amber-100 to-orange-100 dark:bg-gray-800 border border-amber-200 dark:border-gray-800';
      default:
        return 'flex items-center space-x-3 p-4 border-b border-amber-200 dark:border-gray-800 last:border-b-0';
    }
  };

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      {/* List Header */}
      {(showHeader || title) && (
        <div className="px-6 py-4 border-b border-amber-300 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {title ? (
              <SkeletonBase
                width="8rem"
                height="1.5rem"
                rounded="md"
              />
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center space-x-2">
              <SkeletonBase
                width="1rem"
                height="1rem"
                rounded="sm"
              />
              <SkeletonBase
                width="3rem"
                height="0.75rem"
                rounded="sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* List Items */}
      <div className={variant === 'compact' ? 'space-y-2 p-4' : variant === 'events' ? 'px-6' : ''}>
        {Array.from({ length: items }, (_, index) => (
          <div key={index} className={getItemClasses()}>
            {/* Icon/Avatar */}
            {(showIcons || showAvatars) && (
              <div className="flex-shrink-0">
                <SkeletonBase
                  width={showAvatars ? '2.5rem' : '1.5rem'}
                  height={showAvatars ? '2.5rem' : '1.5rem'}
                  rounded={showAvatars ? 'full' : 'md'}
                />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Primary text */}
              <SkeletonBase
                width={`${Math.floor(Math.random() * 40) + 60}%`}
                height="1rem"
                rounded="sm"
              />
              
              {/* Secondary text */}
              {showSecondaryText && (
                <SkeletonBase
                  width={`${Math.floor(Math.random() * 30) + 40}%`}
                  height="0.75rem"
                  rounded="sm"
                />
              )}
            </div>

            {/* Actions/Badge */}
            {showActions && (
              <div className="flex-shrink-0">
                <SkeletonBase
                  width="3rem"
                  height="1.5rem"
                  rounded="full"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state for no items */}
      {items === 0 && (
        <div className="px-6 py-8 text-center">
          <div className="flex justify-center mb-2">
            <SkeletonBase
              width="3rem"
              height="3rem"
              rounded="md"
            />
          </div>
          <SkeletonBase
            width="8rem"
            height="1rem"
            className="mx-auto"
            rounded="sm"
          />
        </div>
      )}
    </div>
  );
}