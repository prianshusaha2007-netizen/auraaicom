import { useRef, useCallback, useState } from 'react';

interface UseChatGesturesOptions {
  onLongPress: () => void;
  onSwipeRight: () => void;
  longPressDelay?: number;
  swipeThreshold?: number;
}

export const useChatGestures = ({
  onLongPress,
  onSwipeRight,
  longPressDelay = 500,
  swipeThreshold = 100,
}: UseChatGesturesOptions) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isScrolling.current = false;

    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      onLongPress();
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, longPressDelay);
  }, [onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Cancel long press if user moves finger
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      setIsLongPressing(false);
    }

    // Detect vertical scroll
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      isScrolling.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isScrolling.current && !isLongPressing) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // Swipe right detected (horizontal swipe, minimal vertical)
      if (deltaX > swipeThreshold && deltaY < 50) {
        onSwipeRight();
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
    }

    setIsLongPressing(false);
    isScrolling.current = false;
  }, [onSwipeRight, swipeThreshold, isLongPressing]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
    isScrolling.current = false;
  }, []);

  return {
    isLongPressing,
    gestureHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
  };
};
