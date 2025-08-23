import React from "react";
import SkeletonBase from "./SkeletonBase";

interface SkeletonTableProps {
  /** Number of rows to show */
  rows?: number;
  /** Number of columns to show */
  cols?: number;
  /** Whether to show table header */
  showHeader?: boolean;
  /** Whether to show pagination */
  showPagination?: boolean;
  /** Whether to show table actions/controls */
  showActions?: boolean;
  /** Table title */
  title?: string;
  /** Custom className for the container */
  className?: string;
  /** Variant for different table types */
  variant?: "default" | "standings" | "admin" | "compact";
}

/**
 * Skeleton component for tables (league standings, admin tables, etc.)
 */
export default function SkeletonTable({
  rows = 5,
  cols = 3,
  showHeader = true,
  showPagination = false,
  showActions = false,
  title,
  className = "",
  variant = "default",
}: SkeletonTableProps) {
  // Clamp rows and cols to safe minimum values
  const safeRows = Math.max(1, rows);
  const safeCols = Math.max(1, cols);

  const getTableClasses = () => {
    switch (variant) {
      case "standings":
        return "bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-lg shadow border border-amber-200 dark:border-gray-800";
      case "admin":
        return "bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-lg shadow-sm border border-amber-300 dark:border-gray-800";
      case "compact":
        return "bg-gradient-to-r from-amber-100 to-orange-100 dark:bg-gray-900 rounded-md border border-amber-200 dark:border-gray-800";
      default:
        return "bg-gradient-to-br from-amber-50 via-orange-25 to-amber-75 dark:bg-gray-900 rounded-lg shadow-sm border border-amber-200 dark:border-gray-800";
    }
  };

  return (
    <div className={`${getTableClasses()} ${className}`}>
      {/* Table Header/Title */}
      {(title || showActions) && (
        <div className="px-6 py-4 border-b border-amber-300 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {title && (
              <SkeletonBase width="8rem" height="1.5rem" rounded="md" />
            )}

            {showActions && (
              <div className="flex items-center space-x-2">
                <SkeletonBase width="1.5rem" height="1.5rem" rounded="sm" />
                <SkeletonBase width="4rem" height="1rem" rounded="sm" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Table Header */}
          {showHeader && (
            <thead className="bg-gradient-to-r from-amber-100 to-orange-100 dark:bg-gray-800 border-b border-amber-300 dark:border-gray-700">
              <tr>
                {Array.from({ length: safeCols }, (_, colIndex) => (
                  <th key={colIndex} scope="col" className="px-4 py-3 text-left">
                    <SkeletonBase
                      width={
                        colIndex === 0
                          ? "2rem"
                          : colIndex === safeCols - 1
                          ? "4rem"
                          : "6rem"
                      }
                      height="1rem"
                      rounded="sm"
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Table Body */}
          <tbody>
            {Array.from({ length: safeRows }, (_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-amber-200 dark:border-gray-800 hover:bg-gradient-to-r hover:from-amber-75 hover:to-orange-75 dark:hover:bg-gray-800"
              >
                {Array.from({ length: safeCols }, (_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <SkeletonBase
                      width={
                        colIndex === 0
                          ? "2rem"
                          : colIndex === safeCols - 1
                          ? "3rem"
                          : colIndex === 1
                          ? "8rem"
                          : "5rem"
                      }
                      height="1rem"
                      rounded="sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:bg-gray-800 border-t border-amber-300 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <SkeletonBase width="6rem" height="1rem" rounded="sm" />
            </div>

            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4].map((_, index) => (
                <SkeletonBase
                  key={index}
                  width="2rem"
                  height="1.5rem"
                  rounded="sm"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
