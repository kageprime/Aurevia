import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

type FeaturedProductsCarouselProps = {
  products: Product[];
  onAddToCart: (product: Product) => void;
  ctaLabel?: string;
  compact?: boolean;
  className?: string;
};

export function FeaturedProductsCarousel({
  products,
  onAddToCart,
  ctaLabel = 'Add to Bag',
  compact = false,
  className,
}: FeaturedProductsCarouselProps) {
  const slides = useMemo(() => products.filter((product) => product.isActive !== false), [products]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const activeProduct = slides[Math.min(activeIndex, slides.length - 1)];

  const goPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <div className={cn('relative', className)}>
      {compact ? (
        <div className="bg-white h-full flex flex-col">
          <div className="flex-1 relative min-h-[220px]">
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              className="w-full h-full object-cover grayscale-warm"
            />
          </div>
          <div className="p-4 accent-bg text-white">
            <h3 className="font-bold text-sm mb-1">{activeProduct.name}</h3>
            <p className="text-lg font-bold mb-3">${activeProduct.price}</p>
            <button
              onClick={() => onAddToCart(activeProduct)}
              className="w-full bg-white text-[#0B0B0D] py-2 text-sm font-medium hover:bg-[#0B0B0D] hover:text-white transition-colors"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="aspect-[4/3] lg:aspect-auto overflow-hidden">
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              className="w-full h-full object-cover grayscale-warm"
            />
          </div>
          <div className="accent-bg text-white p-8 lg:p-12 flex flex-col justify-center">
            <span className="font-mono text-xs tracking-mono uppercase mb-4 opacity-80">
              Featured
            </span>
            <h3 className="text-2xl lg:text-3xl font-bold mb-2">{activeProduct.name}</h3>
            <p className="text-lg mb-4 opacity-90">${activeProduct.price}</p>
            <p className="mb-6 opacity-80">{activeProduct.description}</p>
            <button
              onClick={() => onAddToCart(activeProduct)}
              className="bg-white text-[#0B0B0D] px-6 py-3 font-medium w-fit hover:bg-[#0B0B0D] hover:text-white transition-colors"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      )}

      {slides.length > 1 && (
        <>
          <button
            onClick={goPrevious}
            className="absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#0B0B0D] flex items-center justify-center hover:bg-white"
            aria-label="Previous featured product"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            className="absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-[#0B0B0D] flex items-center justify-center hover:bg-white"
            aria-label="Next featured product"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((product, index) => (
              <button
                key={product.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-opacity',
                  index === activeIndex ? 'bg-white opacity-100' : 'bg-white opacity-40 hover:opacity-70'
                )}
                aria-label={`Go to featured product ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
