import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "../../store/authStore";
import { requestTour, requestWelcome, setScreenFocused, useGuideStore } from "./guide-store";
import type { TourId } from "./types";

/** Ekran çizilip hedefler ölçülebilsin diye tur biraz gecikmeyle açılır. */
const START_DELAY_MS = 700;

/**
 * Ekran odaklandığında, bu kullanıcının henüz görmediği adımları başlatır.
 */
export function useScreenTour(tourId: TourId, options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const hydrated = useGuideStore((s) => s.hydrated);
  const armed = useGuideStore((s) => s.armedTourId === tourId);
  const permissionsKey = useAuthStore((s) => s.user?.permissions?.join(",") ?? "");
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      setScreenFocused(tourId, true);
      setFocused(true);
      return () => {
        setFocused(false);
        setScreenFocused(tourId, false);
      };
    }, [tourId, enabled]),
  );

  useEffect(() => {
    if (!focused || !hydrated) return undefined;
    const timer = setTimeout(() => requestTour(tourId), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focused, hydrated, permissionsKey, armed, tourId]);
}

/** Ana sayfa odaklandığında karşılama penceresini açar. Sayfa turu başlatmaz. */
export function useWelcome() {
  const hydrated = useGuideStore((s) => s.hydrated);
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused("dashboard", true);
      setFocused(true);
      return () => {
        setFocused(false);
        setScreenFocused("dashboard", false);
      };
    }, []),
  );

  useEffect(() => {
    if (!focused || !hydrated) return undefined;
    const timer = setTimeout(() => requestWelcome(), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focused, hydrated]);
}
