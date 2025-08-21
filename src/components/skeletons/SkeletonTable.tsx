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
  const getTableClasses = () => {
    switch (variant) {
      case "standings":
        return "bg-white dark:bg-gray-800 rounded-lg shadow";
      case "admin":
        return "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700";
      case "compact":
        return "bg-gray-50 dark:bg-gray-700 rounded-md";
      default:
        return "bg-white dark:bg-gray-800 rounded-lg shadow-sm";
    }
  };

  return (
    <div className={`${getTableClasses()} ${className}`}>
      {/* Table Header/Title */}
      {(title || showActions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {title ? (
              <SkeletonBase width="8rem" height="1.5rem" rounded="md" />
            ) : (
              <div></div>
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
            <thead className="bg-gray-100 dark:bg-gray-600">
              <tr>
                {Array.from({ length: cols }, (_, colIndex) => (
                  <th key={colIndex} className="px-4 py-3 text-left">
                    <SkeletonBase
                      width={
                        colIndex === 0
                          ? "2rem"
                          : colIndex === cols - 1
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
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {Array.from({ length: cols }, (_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <SkeletonBase
                      width={
                        colIndex === 0
                          ? "2rem"
                          : colIndex === cols - 1
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
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600">
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
