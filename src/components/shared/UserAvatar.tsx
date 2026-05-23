"use client";

import { useState, useEffect } from "react";

interface Props {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  dark?: boolean;
  className?: string;
}

/**
 * Resilient circular avatar.
 *
 * Handles two flaky cases that hit us a lot with OAuth providers (Google):
 *  - The image URL fails to load (404, CORS, referrer block). We catch onError
 *    and swap to an initials chip so the row never renders a broken icon.
 *  - Some providers require `referrerPolicy="no-referrer"` to serve the avatar
 *    cross-origin. We set it unconditionally; it has no downside on URLs that
 *    don't need it.
 *
 * Initials are derived from the name first, then email as a fallback. Sizing
 * is driven by `size` (px) so the same component can render in tables, dropdowns
 * and modals consistently.
 */
export function UserAvatar({
  url,
  name,
  email,
  size = 32,
  dark = false,
  className = "",
}: Props) {
  const [failed, setFailed] = useState(false);

  // Reset failure state if URL changes (e.g. paginated list re-renders)
  useEffect(() => {
    setFailed(false);
  }, [url]);

  const initial = ((name || email || "?").trim().charAt(0) || "?").toUpperCase();
  const showInitial = !url || failed;
  const dimensionStyle = { width: size, height: size };

  if (showInitial) {
    return (
      <div
        aria-hidden
        style={dimensionStyle}
        className={`flex flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase ${
          dark
            ? "bg-gray-800 text-gray-400 ring-1 ring-gray-700"
            : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
        } ${className}`}
      >
        {initial}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url || ""}
      alt={name || email || ""}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      style={dimensionStyle}
      className={`flex-shrink-0 rounded-full object-cover ${
        dark ? "ring-1 ring-white/10" : "ring-1 ring-gray-200"
      } ${className}`}
    />
  );
}
