import React from 'react';
import SkeletonBase from './SkeletonBase';
import SkeletonTable from './SkeletonTable';
import SkeletonButton from './SkeletonButton';

interface SkeletonDashboardProps {
  /** Whether to show dashboard header */
  showHeader?: boolean;
  /** Whether to show filters section */
  showFilters?: boolean;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Number of filter inputs to show */
  filterCount?: number;
  /** Custom className for the container */
  className?: string;
  /** Dashboard variant */
  variant?: 'admin' | 'analytics' | 'overview';
}

/**
 * Skeleton component for dashboard layouts
 */
export default function SkeletonDashboard({
  showHeader = true,
  showFilters = true,
  showActions = true,
  filterCount = 4,
  className = '',
  variant = 'admin',
}: SkeletonDashboardProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-25 via-orange-25 to-amber-50 dark:bg-gray-900 ${className}`}>
      {/* Dashboard Header */}
      {showHeader && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:bg-gray-800 border-b border-amber-300 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title and user info */}
            <div className="flex items-center space-x-4">
              <SkeletonBase
                width="2.5rem"
                height="2.5rem"
                rounded="full"
              />
              <div>
                <SkeletonBase
                  width="12rem"
                  height="1.5rem"
                  className="mb-1"
                  rounded="md"
                />
                <SkeletonBase
                  width="8rem"
                  height="1rem"
                  rounded="sm"
                />
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center space-x-3">
              <SkeletonButton
                size="sm"
                showIcon
                variant="secondary"
              />
              <SkeletonButton
                size="sm"
                variant="primary"
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Dashboard Stats/Summary Cards */}
        {variant === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <SkeletonBase
                    width="2rem"
                    height="2rem"
                    rounded="md"
                  />
                  <SkeletonBase
                    width="1rem"
                    height="1rem"
                    rounded="sm"
                  />
                </div>
                <SkeletonBase
                  width="4rem"
                  height="2rem"
                  className="mb-2"
                  rounded="md"
                />
                <SkeletonBase
                  width="6rem"
                  height="1rem"
                  rounded="sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="mb-4">
              <SkeletonBase
                width="6rem"
                height="1.25rem"
                rounded="md"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: filterCount }, (_, index) => (
                <div key={index}>
                  <SkeletonBase
                    width="4rem"
                    height="1rem"
                    className="mb-2"
                    rounded="sm"
                  />
                  <SkeletonBase
                    height="2.5rem"
                    rounded="md"
                  />
                </div>
              ))}
            </div>

            {showActions && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <SkeletonButton size="sm" variant="secondary" />
                  <SkeletonButton size="sm" variant="primary" />
                </div>
                
                <div className="flex items-center space-x-2">
                  <SkeletonBase
                    width="6rem"
                    height="1rem"
                    rounded="sm"
                  />
                  <SkeletonButton size="sm" showIcon />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Content Table */}
        <SkeletonTable
          rows={10}
          cols={6}
          showHeader
          showPagination
          showActions
          variant="admin"
          title="Data Table"
        />

        {/* Additional sections for different variants */}
        {variant === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <SkeletonBase
                  width="8rem"
                  height="1.25rem"
                  rounded="md"
                />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((_, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <SkeletonBase
                      width="2rem"
                      height="2rem"
                      rounded="full"
                    />
                    <div className="flex-1">
                      <SkeletonBase
                        width="80%"
                        height="1rem"
                        className="mb-1"
                        rounded="sm"
                      />
                      <SkeletonBase
                        width="60%"
                        height="0.75rem"
                        rounded="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <SkeletonBase
                  width="6rem"
                  height="1.25rem"
                  rounded="md"
                />
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((_, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <SkeletonBase
                        width="5rem"
                        height="1rem"
                        rounded="sm"
                      />
                      <SkeletonBase
                        width="3rem"
                        height="1rem"
                        rounded="sm"
                      />
                    </div>
                    <SkeletonBase
                      height="0.5rem"
                      rounded="full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}