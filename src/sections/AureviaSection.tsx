import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Product } from '@/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { listFeaturedProductsBySection } from '@/lib/productsApi';
import { toast } from 'sonner';
import { FeaturedProductsCarousel } from '@/components/FeaturedProductsCarousel';

gsap.registerPlugin(ScrollTrigger);

interface AureviaSectionProps {
  onAddToCart: (product: Product) => void;
}

export function AureviaSection({ onAddToCart }: AureviaSectionProps) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tileGRef = useRef<HTMLDivElement>(null);
  const tileHRef = useRef<HTMLDivElement>(null);
  const tileIRef = useRef<HTMLDivElement>(null);
  const pinkBlock5Ref = useRef<HTMLDivElement>(null);
  const pinkBlock6Ref = useRef<HTMLDivElement>(null);
  const brandNameRef = useRef<HTMLDivElement>(null);
  const productCardRef = useRef<HTMLDivElement>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  const fallbackFeaturedProduct: Product = {
    id: 'velvet-matte-01',
    name: 'Velvet Matte Lipstick',
    price: 28,
    category: 'lip',
    subcategory: 'matte',
    image: '/product_lipstick_01.jpg',
    description: 'Long-lasting matte finish'
  };

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const data = await listFeaturedProductsBySection('story-aurevia');
        setFeaturedProducts(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load featured products.';
        toast.error(message);
      }
    };

    loadFeaturedProducts();
  }, []);

  const carouselProducts = featuredProducts.length > 0 ? featuredProducts : [fallbackFeaturedProduct];

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        }
      });

      // ENTRANCE (0% - 30%)
      // Brand letters scatter in
      const letters = brandNameRef.current?.querySelectorAll('.brand-letter');
      if (letters) {
        letters.forEach((letter, i) => {
          const randomX = (Math.random() - 0.5) * 40;
          const randomY = (Math.random() - 0.5) * 40;
          scrollTl.fromTo(letter,
            { x: `${randomX}vw`, y: `${randomY}vh`, rotation: -8, opacity: 0 },
            { x: 0, y: 0, rotation: 0, opacity: 1, ease: 'none' },
            i * 0.02
          );
        });
      }

      // Tiles slide in
      scrollTl.fromTo(tileGRef.current,
        { x: '-50vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(tileHRef.current,
        { x: '50vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(tileIRef.current,
        { y: '50vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.1
      );

      // Pink blocks
      scrollTl.fromTo(pinkBlock5Ref.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'none' },
        0.15
      );

      scrollTl.fromTo(pinkBlock6Ref.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'none' },
        0.18
      );

      // Product card
      scrollTl.fromTo(productCardRef.current,
        { y: '45vh', scale: 0.92, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0.2
      );

      // EXIT (70% - 100%)
      if (letters) {
        scrollTl.fromTo(letters,
          { y: 0, opacity: 1 },
          { y: '-18vh', opacity: 0.25, stagger: 0.01, ease: 'power2.in' },
          0.7
        );
      }

      scrollTl.fromTo(productCardRef.current,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0.25, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo([tileGRef.current, tileHRef.current, tileIRef.current],
        { opacity: 1 },
        { opacity: 0.2, ease: 'power2.in' },
        0.75
      );

    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section 
      ref={sectionRef}
      className="section-pinned bg-[#F6F6F2] z-30"
    >
      <div className="checkerboard-grid">
        {/* Tile G - Eye */}
        <div 
          ref={tileGRef}
          className="grid-tile col-start-1 col-span-3 row-start-1 row-span-3"
        >
          <img src="/aurevia_eye.jpg" alt="Eye" />
        </div>

        {/* Tile H - Lips */}
        <div 
          ref={tileHRef}
          className="grid-tile col-start-10 col-span-3 row-start-1 row-span-3"
        >
          <img src="/aurevia_lips.jpg" alt="Lips" />
        </div>

        {/* Tile I - Portrait */}
        <div 
          ref={tileIRef}
          className="grid-tile col-start-1 col-span-3 row-start-4 row-span-3"
        >
          <img src="/aurevia_portrait.jpg" alt="Portrait" />
        </div>

        {/* Pink Block P5 */}
        <div 
          ref={pinkBlock5Ref}
          className="pink-block col-start-4 col-span-2 row-start-1 row-span-2"
        />

        {/* Pink Block P6 */}
        <div 
          ref={pinkBlock6Ref}
          className="pink-block col-start-6 col-span-2 row-start-5 row-span-2"
        />

        {/* Brand Name AUREVIA */}
        <div 
          ref={brandNameRef}
          className="col-start-4 col-span-6 row-start-2 row-span-3 flex items-center justify-center"
        >
          <div className="flex">
            {'AUREVIA'.split('').map((letter, i) => (
              <span 
                key={i} 
                className={`brand-letter text-display font-bold ${letter === 'V' ? 'accent-text' : ''}`}
                style={{ 
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(48px, 7vw, 100px)'
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Product Card */}
        <div 
          ref={productCardRef}
          className="col-start-10 col-span-3 row-start-4 row-span-3 p-4"
        >
          <FeaturedProductsCarousel
            products={carouselProducts}
            onAddToCart={onAddToCart}
            compact
            className="h-full"
          />
        </div>
      </div>
    </section>
  );
}
