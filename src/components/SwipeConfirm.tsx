import React, { useState, useRef, useEffect } from 'react';

interface SwipeConfirmProps {
  onConfirm: () => void;
  label?: string;
  confirmText?: string;
  resetAfterConfirm?: boolean;
  className?: string;
}

export const SwipeConfirm: React.FC<SwipeConfirmProps> = ({
  onConfirm,
  label = 'Swipe to confirm',
  confirmText = 'CONFIRMED',
  resetAfterConfirm = true,
  className = '',
}) => {
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const CONFIRM_THRESHOLD = 0.85; // 85% of container width

  useEffect(() => {
    if (isConfirmed && resetAfterConfirm) {
      const timer = setTimeout(() => {
        setIsConfirmed(false);
        setPosition(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, resetAfterConfirm]);

  const handleStart = (clientX: number) => {
    if (isConfirmed) return;
    setIsDragging(true);
    startXRef.current = clientX - position;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || isConfirmed) return;

    const container = containerRef.current;
    const slider = sliderRef.current;
    if (!container || !slider) return;

    const containerWidth = container.offsetWidth;
    const sliderWidth = slider.offsetWidth;
    const maxPosition = containerWidth - sliderWidth;

    let newPosition = clientX - startXRef.current;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));

    setPosition(newPosition);
  };

  const handleEnd = () => {
    if (!isDragging || isConfirmed) return;

    const container = containerRef.current;
    const slider = sliderRef.current;
    if (!container || !slider) return;

    const containerWidth = container.offsetWidth;
    const sliderWidth = slider.offsetWidth;
    const maxPosition = containerWidth - sliderWidth;

    if (position >= maxPosition * CONFIRM_THRESHOLD) {
      setPosition(maxPosition);
      setIsConfirmed(true);
      onConfirm();
    } else {
      setPosition(0);
    }

    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isConfirmed) return;

    const container = containerRef.current;
    const slider = sliderRef.current;
    if (!container || !slider) return;

    const containerWidth = container.offsetWidth;
    const sliderWidth = slider.offsetWidth;
    const maxPosition = containerWidth - sliderWidth;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newPosition = Math.min(position + 20, maxPosition);
      setPosition(newPosition);

      if (newPosition >= maxPosition * CONFIRM_THRESHOLD) {
        setPosition(maxPosition);
        setIsConfirmed(true);
        onConfirm();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition(Math.max(position - 20, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPosition(maxPosition);
      setIsConfirmed(true);
      onConfirm();
    }
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMove(e.clientX);
      const handleGlobalMouseUp = () => handleEnd();

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, position]);

  return (
    <div className={`select-none ${className}`}>
      <div
        ref={containerRef}
        className={`
          relative h-16 bg-gray-700 rounded-full overflow-hidden
          ${isConfirmed ? 'bg-green-600' : ''}
          transition-colors duration-300
        `}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={containerRef.current ? (position / (containerRef.current.offsetWidth - 64)) * 100 : 0}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {/* Background text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-lg font-bold text-gray-400">
            {isConfirmed ? confirmText : label}
          </span>
        </div>

        {/* Slider button */}
        <div
          ref={sliderRef}
          className={`
            absolute top-0 left-0 h-16 w-16
            bg-gradient-to-r from-blue-500 to-blue-600
            rounded-full cursor-grab active:cursor-grabbing
            flex items-center justify-center
            shadow-lg
            ${isConfirmed ? 'bg-green-500' : ''}
            ${isDragging ? 'scale-110' : 'scale-100'}
            transition-all duration-200
          `}
          style={{ transform: `translateX(${position}px)` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="text-2xl font-bold text-white">
            {isConfirmed ? '✓' : '→'}
          </span>
        </div>
      </div>
    </div>
  );
};
