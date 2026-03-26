import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Returns true when the OS/browser "Reduce motion" preference is active.
 * Use this to conditionally disable animations in JavaScript (e.g. carousels,
 * canvas animations) that the CSS media query alone cannot suppress.
 *
 * Example:
 *   const reducedMotion = useReducedMotion();
 *   const duration = reducedMotion ? 0 : 300;
 */
export function useReducedMotion(): boolean {
  const [matches, setMatches] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return matches;
}
