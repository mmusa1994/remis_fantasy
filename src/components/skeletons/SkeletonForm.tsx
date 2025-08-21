import React from 'react';
import SkeletonBase from './SkeletonBase';

interface SkeletonFormProps {
  /** Number of form fields to show */
  fields?: number;
  /** Whether to show form title */
  showTitle?: boolean;
  /** Whether to show submit button */
  showSubmitButton?: boolean;
  /** Number of columns for form layout */
  columns?: 1 | 2;
  /** Whether to show form sections */
  showSections?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Form variant */
  variant?: 'default' | 'settings' | 'registration' | 'compact';
}

/**
 * Skeleton component for forms (settings, registration, etc.)
 */
export default function SkeletonForm({
  fields = 4,
  showTitle = true,
  showSubmitButton = true,
  columns = 1,
  showSections = false,
  className = '',
  variant = 'default',
}: SkeletonFormProps) {
  const getFormClasses = () => {
    switch (variant) {
      case 'settings':
        return 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3';
      case 'registration':
        return 'p-8 md:p-12 border-2 border-gray-600/30 rounded-2xl bg-theme-background/80 backdrop-blur-sm';
      case 'compact':
        return 'bg-gray-50 dark:bg-gray-700 rounded-md p-4';
      default:
        return 'bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6';
    }
  };

  const getGridClass = () => {
    return columns === 2 ? 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6' : 'space-y-4';
  };

  const renderFields = (count: number) => {
    return Array.from({ length: count }, (_, index) => (
      <div key={index} className="relative">
        {/* Field Label */}
        <SkeletonBase
          width="6rem"
          height="1rem"
          className="mb-2"
          rounded="sm"
        />
        
        {/* Field Input */}
        <SkeletonBase
          height="2.5rem"
          rounded="md"
          className="w-full"
        />
      </div>
    ));
  };

  return (
    <div className={`${getFormClasses()} ${className}`}>
      {/* Form Title */}
      {showTitle && (
        <div className="mb-6">
          <SkeletonBase
            width="12rem"
            height="1.5rem"
            rounded="md"
          />
        </div>
      )}

      {/* Form Sections */}
      {showSections ? (
        <div className="space-y-8">
          {/* Section 1 */}
          <div>
            <SkeletonBase
              width="8rem"
              height="1.25rem"
              className="mb-4"
              rounded="md"
            />
            <div className={getGridClass()}>
              {renderFields(Math.ceil(fields / 2))}
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <SkeletonBase
              width="10rem"
              height="1.25rem"
              className="mb-4"
              rounded="md"
            />
            <div className={getGridClass()}>
              {renderFields(Math.floor(fields / 2))}
            </div>
          </div>
        </div>
      ) : (
        /* Regular form fields */
        <div className={getGridClass()}>
          {renderFields(fields)}
        </div>
      )}

      {/* Additional form elements for registration variant */}
      {variant === 'registration' && (
        <div className="mt-8 space-y-6">
          {/* Selection cards */}
          <div>
            <SkeletonBase
              width="8rem"
              height="1.25rem"
              className="mb-4"
              rounded="md"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((_, index) => (
                <div key={index} className="border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
                  <SkeletonBase
                    height="12rem"
                    rounded="none"
                  />
                  <div className="p-6">
                    <SkeletonBase
                      width="8rem"
                      height="1.25rem"
                      className="mb-2"
                      rounded="md"
                    />
                    <SkeletonBase
                      height="3rem"
                      rounded="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File upload area */}
          <div>
            <SkeletonBase
              width="10rem"
              height="1.25rem"
              className="mb-4"
              rounded="md"
            />
            <SkeletonBase
              height="8rem"
              className="border-2 border-dashed border-gray-300 dark:border-gray-600"
              rounded="lg"
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      {showSubmitButton && (
        <div className="mt-6">
          <SkeletonBase
            width={variant === 'registration' ? '100%' : '8rem'}
            height="2.5rem"
            rounded="md"
          />
        </div>
      )}
    </div>
  );
}