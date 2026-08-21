"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowDown, RefreshCw } from "lucide-react";

/** px of damped pull distance required to trigger a refresh on release */
const THRESHOLD = 60;
/** hard cap on how far the content can be dragged down */
const MAX_PULL = 80;

/**
 * Wraps the page scroll container and provides a native-feeling
 * pull-to-refresh gesture. Works inside an overflow-hidden layout
 * (where browser PTR never fires) by tracking touch events on the
 * container and shifting content down with a spring animation.
 *
 * On release past THRESHOLD: calls router.refresh() to re-run
 * all server components on the current page.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Ref to the inner <main> so we can gate on scrollTop === 0
  const mainRef = useRef<HTMLElement>(null);

  // Finger position when the gesture started
  const startYRef = useRef(0);
  // Whether a valid PTR gesture is currently in progress
  const activeRef = useRef(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Raw value set directly from touch events (no spring on input)
  const rawPull = useMotionValue(0);
  // Spring-eased version used for the transform — gives elastic feel
  const springPull = useSpring(rawPull, { stiffness: 420, damping: 42 });

  // Derived motion values for the indicator
  const indicatorOpacity = useTransform(springPull, [0, 20], [0, 1]);
  const arrowRotate = useTransform(springPull, [0, MAX_PULL], [0, 180]);

  // ── Touch handlers ──────────────────────────────────────────────────────────

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      // Only activate when the scroll container is at the very top
      if ((mainRef.current?.scrollTop ?? 1) > 0) return;
      if (isRefreshing) return;
      startYRef.current = e.touches[0].clientY;
      activeRef.current = true;
    },
    [isRefreshing]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!activeRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;

      if (delta <= 0) {
        // Scrolling upward — cancel gesture
        rawPull.set(0);
        return;
      }

      // Rubber-band damping: pull feels increasingly heavy
      const damped = Math.min((delta * 0.55) / (1 + delta / 130), MAX_PULL);
      rawPull.set(damped);
    },
    [rawPull]
  );

  const onTouchEnd = useCallback(async () => {
    if (!activeRef.current) return;
    activeRef.current = false;

    const current = rawPull.get();

    if (current >= THRESHOLD * 0.8) {
      // Hold indicator in place while refreshing
      setIsRefreshing(true);
      rawPull.set(46);
      router.refresh();
      await new Promise((r) => setTimeout(r, 1200));
      setIsRefreshing(false);
    }

    rawPull.set(0);
  }, [rawPull, router]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex-1 overflow-hidden flex flex-col relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Indicator — absolutely behind the content, revealed as content shifts */}
      <motion.div
        aria-hidden
        className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none z-10"
        style={{ height: springPull, opacity: indicatorOpacity }}
      >
        {isRefreshing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.65, ease: "linear" }}
            className="text-[#FF6B5E]"
          >
            <RefreshCw size={18} strokeWidth={2.5} />
          </motion.div>
        ) : (
          <motion.div style={{ rotate: arrowRotate }} className="text-[#FF6B5E]">
            <ArrowDown size={18} strokeWidth={2.5} />
          </motion.div>
        )}
      </motion.div>

      {/* Content — springs downward on pull, snaps back on release */}
      <motion.div
        className="flex-1 flex flex-col h-full"
        style={{ y: springPull }}
      >
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto h-full scroll-smooth relative z-0"
        >
          {children}
        </main>
      </motion.div>
    </div>
  );
}
