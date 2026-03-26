import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plus } from 'lucide-react';
import type { Product } from '@/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { listFeaturedProductsBySection, listProducts } from '@/lib/productsApi';
import { toast } from 'sonner';
import { FeaturedProductsCarousel } from '@/components/FeaturedProductsCarousel';

gsap.registerPlugin(ScrollTrigger);

interface SkincareShopProps {
  onAddToCart: (product: Product) => void;
}

export function SkincareShop({ onAddToCart }: SkincareShopProps) {
  const INITIAL_VISIBLE_PRODUCTS = 3;
  const LOAD_MORE_STEP = 3;

  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Header reveal
      gsap.fromTo(headerRef.current,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Featured tile parallax
      const featuredImg = featuredRef.current?.querySelector('img');
      if (featuredImg) {
        gsap.fromTo(featuredImg,
          { y: 20 },
          {
            y: -20,
            ease: 'none',
            scrollTrigger: {
              trigger: featuredRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      }

      // Cards stagger reveal
      cardsRef.current.forEach((card, i) => {
        if (card) {
          gsap.fromTo(card,
            { y: 40, scale: 0.98, opacity: 0 },
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 0.5,
              delay: i * 0.08,
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
              }
            }
          );
        }
      });
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const [allSkincareProducts, featuredSkincareProducts] = await Promise.all([
          listProducts('skincare'),
          listFeaturedProductsBySection('shop-skincare'),
        ]);

        const activeProducts = allSkincareProducts.filter((product) => product.isActive !== false);
        setProducts(activeProducts);
        setFeaturedProducts(featuredSkincareProducts);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load skincare products.';
        toast.error(message);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const featuredProductIds = new Set(featuredProducts.map((product) => product.id));
  const remainingProducts = products.filter((product) => !featuredProductIds.has(product.id));
  const visibleProducts = remainingProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < remainingProducts.length;

  return (
    <section 
      ref={sectionRef}
      id="shop-skincare"
      className="relative bg-[#F6F6F2] z-[80] py-24 px-6 lg:px-12"
    >
      {/* Header */}
      <div ref={headerRef} className="mb-12">
        <h2 
          className="text-heading font-bold mb-4"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          SKINCARE
        </h2>
        <p className="text-[#6E6E73] max-w-md">
          Clean formulas for radiant skin.
        </p>
      </div>

      {/* Featured Product */}
      {isLoadingProducts ? (
        <p className="text-[#6E6E73]">Loading products...</p>
      ) : featuredProducts.length > 0 ? (
        <div 
          ref={featuredRef}
          className="mb-12 relative overflow-hidden"
        >
          <FeaturedProductsCarousel
            products={featuredProducts}
            onAddToCart={onAddToCart}
            ctaLabel="Add to Bag"
          />
        </div>
      ) : (
        <p className="text-[#6E6E73] mb-8">No skincare products available yet.</p>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleProducts.map((product, i) => (
          <div 
            key={product.id}
            ref={el => { cardsRef.current[i] = el; }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square mb-4 overflow-hidden bg-white">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover grayscale-warm transition-transform duration-500 group-hover:scale-105"
              />
              {/* Pink accent bar on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-1 accent-bg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              
              {/* Quick add button */}
              <button 
                onClick={() => onAddToCart(product)}
                className="absolute bottom-4 right-4 w-10 h-10 accent-bg text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-300 hover:bg-[#0B0B0D]"
                aria-label={`Add ${product.name} to bag`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-medium text-[#0B0B0D] mb-1">{product.name}</h3>
            <p className="text-[#6E6E73] text-sm">${product.price}</p>
          </div>
        ))}
      </div>

      {hasMoreProducts && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setVisibleCount((current) => current + LOAD_MORE_STEP)}
            className="btn-pink-outline"
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
}
