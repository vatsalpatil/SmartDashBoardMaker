import React from 'react';

/**
 * PageContainer provides a consistent, centered focus for standard pages.
 * It prevents content from sticking to the edges of large screens.
 * 
 * @param {Object} props
 * @param {boolean} props.wide - If true, uses a wider max-width (useful for dashboards)
 * @param {boolean} props.fullscreen - If true, removes max-width and internal padding (useful for editors)
 */
export function PageContainer({ children, wide = false, fullscreen = false, className = "" }) {
  if (fullscreen) {
    return (
      <div className={`w-full h-full flex flex-col ${className}`}>
        {children}
      </div>
    );
  }

  // const maxWidth = wide ? 'max-w-(--width-container-wide)' : 'max-w-(--width-container)';

  return (
    <div className={`w-full mx-auto px-4 sm:px-6 lg:px-10 py-8 ${className}`}>
      {/* <div className={`w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-10 py-8 ${className}`}> */}
      {children}
    </div>
  );
}
