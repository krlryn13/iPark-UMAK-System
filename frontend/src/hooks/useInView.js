import { useEffect, useRef, useState } from 'react';

/**
 * useInView — Lightweight scroll-trigger hook using IntersectionObserver.
 * Returns [ref, inView] — attach ref to any element you want to animate on scroll.
 *
 * @param {Object} options
 * @param {number}  options.threshold  - 0.0 to 1.0, how much of element must be visible (default: 0.15)
 * @param {boolean} options.once       - If true, stops observing after first trigger (default: true)
 * @param {string}  options.rootMargin - CSS margin offset for trigger zone (default: '0px 0px -60px 0px')
 */
export const useInView = ({ threshold = 0.15, once = true, rootMargin = '0px 0px -60px 0px' } = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion accessibility setting
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, inView];
};

/**
 * useInViewStagger — Returns multiple [ref, inView] pairs for staggered children.
 * Each item in the returned array is [ref, inView].
 *
 * @param {number} count - Number of staggered elements
 * @param {Object} options - Same options as useInView
 */
export const useInViewStagger = (count, options = {}) => {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setInView(true);
      return;
    }

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.once !== false) observer.unobserve(element);
        }
      },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px 0px -40px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [containerRef, inView, count];
};
