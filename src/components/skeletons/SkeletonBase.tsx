import React from "react";

interface SkeletonBaseProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  animate?: boolean;
  children?: React.ReactNode;
}

/**
 * Base skeleton component with consistent styling and animation
 * All other skeleton components should use this as their foundation
 */
export default function SkeletonBase({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = "md",
  animate = true,
  children,
}: SkeletonBaseProps) {
  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  const animationClass = animate ? "animate-pulse" : "";

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${roundedClasses[rounded]} ${animationClass} ${className}`}
      style={style}
      role="status"
      aria-label="Loading content"
    >
      {children}
    </div>
  );
}
