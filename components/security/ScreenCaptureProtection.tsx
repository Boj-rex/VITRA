"use client";

import React from "react";

/**
 * ScreenCaptureProtection pass-through container.
 * Dev mode browser restrictions (F12, right-click context menu,
 * developer inspection, window blur curtain, and user-select restrictions)
 * have been removed to ensure seamless browser functionality,
 * developer inspection, and natural user experience across devices.
 */
export function ScreenCaptureProtection({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
