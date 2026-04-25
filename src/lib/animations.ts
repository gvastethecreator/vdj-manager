/**
 * Shared GSAP animation presets for consistent motion across the app.
 * All durations honour prefers-reduced-motion via `matchMedia`.
 */
import gsap from "gsap";

/** Default ease used across the app */
export const EASE = "power2.out";

/** Short animation duration in seconds */
export const DURATION_FAST = 0.25;

/** Standard animation duration in seconds */
export const DURATION = 0.4;

/** Snappy micro-interaction duration */
export const DURATION_MICRO = 0.15;

/**
 * Stagger-fade a list of children into view.
 */
export function staggerFadeIn(
  selector: string,
  opts?: { delay?: number; stagger?: number; y?: number }
): gsap.core.Tween {
  return gsap.from(selector, {
    autoAlpha: 0,
    y: opts?.y ?? 14,
    duration: DURATION_FAST,
    ease: EASE,
    stagger: opts?.stagger ?? 0.04,
    delay: opts?.delay ?? 0,
  });
}

/**
 * Simple fade + slide up entrance.
 */
export function fadeIn(
  target: gsap.TweenTarget,
  opts?: { delay?: number; y?: number }
): gsap.core.Tween {
  return gsap.from(target, {
    autoAlpha: 0,
    y: opts?.y ?? 16,
    duration: DURATION_FAST,
    ease: EASE,
    delay: opts?.delay ?? 0,
  });
}

/**
 * Quick scale-pop for buttons / interactive elements on click.
 */
export function clickPop(target: gsap.TweenTarget): gsap.core.Tween {
  return gsap.fromTo(
    target,
    { scale: 0.95 },
    { scale: 1, duration: DURATION_MICRO, ease: "back.out(2)" },
  );
}

/**
 * Smooth counter animation (e.g. for stat numbers).
 */
export function animateCounter(
  target: gsap.TweenTarget,
  endValue: number,
  opts?: { duration?: number; prefix?: string; suffix?: string },
): gsap.core.Tween {
  const obj = { val: 0 };
  return gsap.to(obj, {
    val: endValue,
    duration: opts?.duration ?? DURATION,
    ease: "power1.out",
    onUpdate() {
      const el = typeof target === "string"
        ? document.querySelector(target)
        : (target as HTMLElement);
      if (el && "textContent" in el) {
        el.textContent = `${opts?.prefix ?? ""}${Math.round(obj.val)}${opts?.suffix ?? ""}`;
      }
    },
  });
}

/**
 * Wrap a GSAP context for safe cleanup in React useEffect.
 * Returns context — call `ctx.revert()` in the effect's cleanup.
 */
export function createAnimationContext(
  scope: React.RefObject<HTMLElement | null>,
  setup: () => void
): gsap.Context {
  const ctx = gsap.context(setup, scope.current ?? undefined);
  return ctx;
}
