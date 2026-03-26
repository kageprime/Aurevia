import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Product } from '@/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { listFeaturedProductsBySection } from '@/lib/productsApi';
import { toast } from 'sonner';
import { FeaturedProductsCarousel } from '@/components/FeaturedProductsCarousel';

gsap.registerPlugin(ScrollTrigger);

interface DeconstructedSectionProps {
  onAddToCart: (product: Product) => void;
}

export function DeconstructedSection({ onAddToCart }: DeconstructedSectionProps) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tileMRef = useRef<HTMLDivElement>(null);
  const tileNRef = useRef<HTMLDivElement>(null);
  const tileORef = useRef<HTMLDivElement>(null);
  const tilePRef = useRef<HTMLDivElement>(null);
  const pinkBlock8Ref = useRef<HTMLDivElement>(null);
  const pinkBlock9Ref = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const productCardRef = useRef<HTMLDivElement>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  const fallbackFeaturedProduct: Product = {
    id: 'hydrating-tint-01',
    name: 'Hydrating Lip Tint',
    price: 24,
    category: 'lip',
    subcategory: 'tint',
    image: '/product_tint_01.jpg',
    description: 'Sheer color with hydration'
  };

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const data = await listFeaturedProductsBySection('story-deconstructed');
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
          end: '+=140%',
          pin: true,
          scrub: 0.6,
        }
      });

      // ENTRANCE (0% - 30%)
      scrollTl.fromTo(headlineRef.current,
        { y: '-35vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(subheadlineRef.current,
        { y: '-25vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.05
      );

      // Tiles from edges
      scrollTl.fromTo(tileMRef.current,
        { x: '-50vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.08
      );

      scrollTl.fromTo(tileNRef.current,
        { x: '-50vw', y: '20vh', opacity: 0 },
        { x: 0, y: 0, opacity: 1, ease: 'none' },
        0.1
      );

      scrollTl.fromTo(tileORef.current,
        { x: '50vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0.12
      );

      scrollTl.fromTo(tilePRef.current,
        { x: '50vw', y: '20vh', opacity: 0 },
        { x: 0, y: 0, opacity: 1, ease: 'none' },
        0.14
      );

      // Pink blocks
      scrollTl.fromTo([pinkBlock8Ref.current, pinkBlock9Ref.current],
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.02, ease: 'none' },
        0.16
      );

      // Product card
      scrollTl.fromTo(productCardRef.current,
        { y: '50vh', scale: 0.9, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0.2
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(productCardRef.current,
        { y: 0, opacity: 1 },
        { y: '-30vh', opacity: 0.25, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo([headlineRef.current, subheadlineRef.current],
        { y: 0, opacity: 1 },
        { y: '-18vh', opacity: 0.25, stagger: 0.02, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo([tileMRef.current, tileNRef.current, tileORef.current, tilePRef.current],
        { opacity: 1 },
        { opacity: 0.2, stagger: 0.02, ease: 'power2.in' },
        0.75
      );

    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section 
      ref={sectionRef}
      id="deconstructed-section"
      className="section-pinned bg-[#F6F6F2] z-50"
    >
      <div className="checkerboard-grid">
        {/* Tile M - Eye */}
        <div 
          ref={tileMRef}
          className="grid-tile col-start-1 col-span-4 row-start-1 row-span-3"
        >
          <img src="/deconstructed_hand.jpg" alt="Hand" />
        </div>

        {/* Tile N - Lips */}
        <div 
          ref={tileNRef}
          className="grid-tile col-start-1 col-span-4 row-start-4 row-span-3"
        >
          <img src="/hero_lips_closeup.jpg" alt="Lips" />
        </div>

        {/* Tile O - Portrait */}
        <div 
          ref={tileORef}
          className="grid-tile col-start-9 col-span-4 row-start-1 row-span-3"
        >
          <img src="/deconstructed_portrait.jpg" alt="Portrait" />
        </div>

        {/* Tile P - Hand */}
        <div 
          ref={tilePRef}
          className="grid-tile col-start-9 col-span-4 row-start-4 row-span-3"
        >
          <img src="/hero_hand_nails.jpg" alt="Hand" />
        </div>

        {/* Pink Block P8 */}
        <div 
          ref={pinkBlock8Ref}
          className="pink-block col-start-5 col-span-2 row-start-1 row-span-2"
        />

        {/* Pink Block P9 */}
        <div 
          ref={pinkBlock9Ref}
          className="pink-block col-start-7 col-span-2 row-start-5 row-span-2"
        />

        {/* Headline */}
        <h2 
          ref={headlineRef}
          className="col-start-5 col-span-4 row-start-2 row-span-1 flex items-end justify-center text-heading font-bold"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          DECONSTRUCTED
        </h2>

        {/* Subheadline */}
        <p 
          ref={subheadlineRef}
          className="col-start-5 col-span-4 row-start-3 row-span-1 flex items-start justify-center text-center text-[#6E6E73] pt-2"
        >
          Clean formulas. Bold finish. Built to mix.
        </p>

        {/* Product Card */}
        <div 
          ref={productCardRef}
          className="col-start-5 col-span-4 row-start-4 row-span-3 p-4 flex items-center justify-center"
        >
          <FeaturedProductsCarousel
            products={carouselProducts}
            onAddToCart={onAddToCart}
            compact
            ctaLabel="Shop Now"
            className="w-full max-w-[280px]"
          />
        </div>
      </div>
    </section>
  );
}
