"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — animates from `from` to `to` over `duration` ms.
 * Used for the receive amount when a fresh quote lands.
 * Linear easing feels "money-grade" per Ghost polish list.
 */
export function useCountUp(target: number, duration: number = 600): number {
  const [value, setValue] = useState(target);
  const previousRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = previousRef.current;
    const to = target;
    if (from === to) {
      setValue(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        previousRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}