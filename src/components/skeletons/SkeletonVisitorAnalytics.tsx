import React from 'react';
import SkeletonBase from './SkeletonBase';

interface SkeletonVisitorAnalyticsProps {
  className?: string;
}

/**
 * Sophisticated skeleton component specifically designed for visitor analytics page
 * Includes stats cards, charts placeholders, and data table with theme adaptation
 */
export default function SkeletonVisitorAnalytics({
  className = '',
}: SkeletonVisitorAnalyticsProps) {
  return (
    <div className={`min-h-screen bg-gray-900 text-white ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SkeletonBase
              width="2rem"
              height="2rem"
              rounded="md"
              className="bg-gray-700"
            />
            <SkeletonBase
              width="12rem"
              height="2rem"
              rounded="md"
              className="bg-gray-700"
            />
          </div>
          <SkeletonBase
            width="20rem"
            height="1.25rem"
            rounded="md"
            className="bg-gray-700"
          />
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((_, index) => (
            <div
              key={index}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <SkeletonBase
                    width="70%"
                    height="1rem"
                    className="mb-3 bg-gray-700"
                    rounded="sm"
                  />
                  <SkeletonBase
                    width="60%"
                    height="2rem"
                    className="bg-gray-600"
                    rounded="md"
                  />
                </div>
                <SkeletonBase
                  width="2rem"
                  height="2rem"
                  rounded="md"
                  className="bg-gray-700"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Top Countries and Pages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Countries */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <SkeletonBase
                width="1.25rem"
                height="1.25rem"
                rounded="md"
                className="bg-gray-700"
              />
              <SkeletonBase
                width="6rem"
                height="1.25rem"
                rounded="md"
                className="bg-gray-700"
              />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <SkeletonBase
                      width="1.5rem"
                      height="1.5rem"
                      rounded="sm"
                      className="bg-gray-700"
                    />
                    <SkeletonBase
                      width="5rem"
                      height="1rem"
                      rounded="sm"
                      className="bg-gray-700"
                    />
                  </div>
                  <SkeletonBase
                    width="2rem"
                    height="1rem"
                    rounded="sm"
                    className="bg-gray-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <SkeletonBase
                width="1.25rem"
                height="1.25rem"
                rounded="md"
                className="bg-gray-700"
              />
              <SkeletonBase
                width="6rem"
                height="1.25rem"
                rounded="md"
                className="bg-gray-700"
              />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center"
                >
                  <SkeletonBase
                    width={`${Math.random() * 40 + 40}%`}
                    height="1rem"
                    rounded="sm"
                    className="bg-gray-700"
                  />
                  <SkeletonBase
                    width="2rem"
                    height="1rem"
                    rounded="sm"
                    className="bg-gray-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visitors Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-700">
            <SkeletonBase
              width="8rem"
              height="1.25rem"
              rounded="md"
              className="bg-gray-700"
            />
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {/* Table Headers */}
            <div className="bg-gray-750 px-6 py-3 border-b border-gray-700">
              <div className="grid grid-cols-6 gap-4">
                {['Vrijeme', 'Lokacija', 'Stranica', 'Uređaj', 'Browser', 'Referrer'].map((_, index) => (
                  <SkeletonBase
                    key={index}
                    width="60%"
                    height="0.875rem"
                    rounded="sm"
                    className="bg-gray-700"
                  />
                ))}
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-700">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="px-6 py-4 hover:bg-gray-750/50 transition-colors"
                >
                  <div className="grid grid-cols-6 gap-4 items-center">
                    {/* Time */}
                    <SkeletonBase
                      width="80%"
                      height="1rem"
                      rounded="sm"
                      className="bg-gray-700"
                    />
                    
                    {/* Location with flag */}
                    <div className="flex items-center gap-2">
                      <SkeletonBase
                        width="1.25rem"
                        height="1.25rem"
                        rounded="sm"
                        className="bg-gray-700"
                      />
                      <SkeletonBase
                        width="70%"
                        height="1rem"
                        rounded="sm"
                        className="bg-gray-700"
                      />
                    </div>
                    
                    {/* Page URL */}
                    <SkeletonBase
                      width="85%"
                      height="1rem"
                      rounded="sm"
                      className="bg-gray-700"
                    />
                    
                    {/* Device */}
                    <div className="flex items-center gap-2">
                      <SkeletonBase
                        width="1rem"
                        height="1rem"
                        rounded="sm"
                        className="bg-gray-700"
                      />
                      <SkeletonBase
                        width="60%"
                        height="1rem"
                        rounded="sm"
                        className="bg-gray-700"
                      />
                    </div>
                    
                    {/* Browser */}
                    <SkeletonBase
                      width="70%"
                      height="1rem"
                      rounded="sm"
                      className="bg-gray-700"
                    />
                    
                    {/* Referrer */}
                    <SkeletonBase
                      width="65%"
                      height="1rem"
                      rounded="sm"
                      className="bg-gray-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <SkeletonBase
              width="12rem"
              height="1rem"
              rounded="sm"
              className="bg-gray-700"
            />
            <div className="flex gap-2">
              <SkeletonBase
                width="5rem"
                height="2rem"
                rounded="md"
                className="bg-gray-700"
              />
              <SkeletonBase
                width="5rem"
                height="2rem"
                rounded="md"
                className="bg-gray-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}