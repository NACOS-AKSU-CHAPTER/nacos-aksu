import { useCallback, useRef, useState, useEffect } from "react";

interface UseScrollAnimationOptions {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
    const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;
    const [isVisible, setIsVisible] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const ref = useCallback((node: HTMLElement | null) => {
        // Disconnect any existing observer
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        if (node) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        if (triggerOnce) {
                            observer.unobserve(node);
                        }
                    } else if (!triggerOnce) {
                        setIsVisible(false);
                    }
                },
                { threshold, rootMargin }
            );

            observer.observe(node);
            observerRef.current = observer;
        }
    }, [threshold, rootMargin, triggerOnce]);

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    return { ref, isVisible };
};
