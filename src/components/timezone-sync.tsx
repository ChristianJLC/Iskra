"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/actions/profile";

export function TimezoneSync({ currentTimezone }: { currentTimezone: string }) {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected && detected !== currentTimezone) {
      syncTimezone(detected);
    }
  }, [currentTimezone]);

  return null;
}
