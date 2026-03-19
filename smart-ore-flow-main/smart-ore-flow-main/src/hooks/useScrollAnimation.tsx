import { useEffect, useRef } from 'react';

export const useScrollAnimation = () => {
  useEffect(() => {
    
    if (typeof IntersectionObserver === 'undefined') {
      
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach((el) => el.classList.add('animate-in'));
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,  
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // Optionally unobserve after animation to improve performance
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all elements with scroll-animate class
    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => {
      // Check if element is already in viewport
      const rect = el.getBoundingClientRect();
      const isInViewport = 
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
      
      if (isInViewport) {
        // If already visible, add animate-in immediately
        el.classList.add('animate-in');
      } else {
        // Otherwise, observe for when it enters viewport
        observer.observe(el);
      }
    });

    // Cleanup
    return () => {
      elements.forEach((el) => {
        if (observer) {
          observer.unobserve(el);
        }
      });
    };
  }, []);
};

/**
 * Hook to animate a specific element when it enters the viewport
 */
export const useElementScrollAnimation = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If element already has animate-in, skip
    if (element.classList.contains('animate-in')) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  return ref;
};

