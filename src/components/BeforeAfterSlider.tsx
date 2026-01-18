import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const BeforeAfterSlider = ({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: BeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-[4/3] sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden cursor-ew-resize select-none border border-border shadow-lg bg-muted/30 touch-none",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* After Image (Background - Full) */}
      <img
        src={afterImage}
        alt="After enhancement"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />

      {/* Before Image (Clipped from left) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt="Before enhancement"
          className="absolute top-0 left-0 h-full object-contain"
          style={{ 
            width: containerWidth ? `${containerWidth}px` : '100%',
            maxWidth: 'none'
          }}
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Slider Handle - Responsive sizes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-xl flex items-center justify-center border-2 sm:border-4 border-primary transition-transform hover:scale-110 active:scale-95">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-primary w-4 h-4 sm:w-5 sm:h-5"
          >
            <path d="M8 6L4 12L8 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 6L20 12L16 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels - Responsive sizes and positioning */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-black/70 text-white text-[10px] sm:text-xs font-semibold rounded-full backdrop-blur-sm">
        {beforeLabel}
      </div>
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-primary text-primary-foreground text-[10px] sm:text-xs font-semibold rounded-full backdrop-blur-sm shadow-lg">
        {afterLabel}
      </div>

      {/* Gradient overlay on edges */}
      <div className="absolute inset-y-0 left-0 w-4 sm:w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-4 sm:w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};
