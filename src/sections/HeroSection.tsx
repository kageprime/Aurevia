import { useEffect, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tileARef = useRef<HTMLDivElement>(null);
  const tileBRef = useRef<HTMLDivElement>(null);
  const tileCRef = useRef<HTMLDivElement>(null);
  const tileDRef = useRef<HTMLDivElement>(null);
  const pinkBlock1Ref = useRef<HTMLDivElement>(null);
  const pinkBlock2Ref = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  // Load animation
  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Tiles fade in with scale
      tl.fromTo([tileARef.current, tileBRef.current, tileCRef.current, tileDRef.current], 
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.9, stagger: 0.06 }
      );

      // Pink blocks slide in
      tl.fromTo(pinkBlock1Ref.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6 },
        '-=0.5'
      );
      tl.fromTo(pinkBlock2Ref.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      );

      // Headline words rise
      tl.fromTo(headlineRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        '-=0.3'
      );

      // Subheadline
      tl.fromTo(subheadlineRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.4'
      );

      // CTA pops in
      tl.fromTo(ctaRef.current,
        { scale: 0.96, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4 },
        '-=0.2'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Scroll animation
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
          onLeaveBack: () => {
            // Reset all elements to visible when scrolling back to top
            gsap.set([tileARef.current, tileBRef.current, tileCRef.current, tileDRef.current], {
              opacity: 1, x: 0, y: 0, rotation: 0
            });
            gsap.set([headlineRef.current, subheadlineRef.current], {
              opacity: 1, x: 0
            });
            gsap.set([pinkBlock1Ref.current, pinkBlock2Ref.current], {
              opacity: 1, x: 0, y: 0
            });
          }
        }
      });

      // EXIT phase (70% - 100%)
      scrollTl.fromTo(headlineRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(subheadlineRef.current,
        { x: 0, opacity: 1 },
        { x: '-12vw', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(tileARef.current,
        { x: 0, opacity: 1, rotation: 0 },
        { x: '-55vw', opacity: 0.2, rotation: -2, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(tileBRef.current,
        { x: 0, opacity: 1, rotation: 0 },
        { x: '55vw', opacity: 0.2, rotation: 2, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(tileCRef.current,
        { y: 0, opacity: 1 },
        { y: '40vh', opacity: 0.2, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(tileDRef.current,
        { y: 0, opacity: 1 },
        { y: '-40vh', opacity: 0.2, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(pinkBlock1Ref.current,
        { x: 0, opacity: 1 },
        { x: '-30vw', opacity: 0.2, ease: 'power2.in' },
        0.75
      );

      scrollTl.fromTo(pinkBlock2Ref.current,
        { y: 0, opacity: 1 },
        { y: '30vh', opacity: 0.2, ease: 'power2.in' },
        0.75
      );

    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  const scrollToShop = () => {
    navigate('/shop#shop-lip');
  };

  return (
    <section 
      ref={sectionRef} 
      id="hero"
      className="section-pinned bg-[#F6F6F2] z-10"
    >
      <div className="checkerboard-grid">
        {/* Tile A - Eye close-up */}
        <div 
          ref={tileARef}
          className="grid-tile col-start-1 col-span-4 row-start-1 row-span-3"
        >
          <img src="/hero_eye_closeup.jpg" alt="Eye close-up" />
        </div>

        {/* Tile B - Lips close-up */}
        <div 
          ref={tileBRef}
          className="grid-tile col-start-9 col-span-4 row-start-1 row-span-3"
        >
          <img src="/hero_lips_closeup.jpg" alt="Lips close-up" />
        </div>

        {/* Tile C - Hand/nails */}
        <div 
          ref={tileCRef}
          className="grid-tile col-start-1 col-span-4 row-start-4 row-span-3"
        >
          <img src="/hero_hand_nails.jpg" alt="Hand with nails" />
        </div>

        {/* Tile D - Model portrait */}
        <div 
          ref={tileDRef}
          className="grid-tile col-start-9 col-span-4 row-start-4 row-span-3"
        >
          <img src="/hero_model_portrait.jpg" alt="Model portrait" />
        </div>

        {/* Pink Block P1 */}
        <div 
          ref={pinkBlock1Ref}
          className="pink-block col-start-5 col-span-2 row-start-1 row-span-2"
        />

        {/* Pink Block P2 */}
        <div 
          ref={pinkBlock2Ref}
          className="pink-block col-start-7 col-span-2 row-start-5 row-span-2"
        />

        {/* Headline */}
        <div 
          ref={headlineRef}
          className="col-start-7 col-span-5 row-start-1 row-span-2 flex items-start justify-end pt-8 pr-8"
        >
          <h1 className="text-display font-bold text-right text-[#0B0B0D]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            BEAUTY<br />IN PIECES
          </h1>
        </div>

        {/* Subheadline */}
        <div 
          ref={subheadlineRef}
          className="col-start-5 col-span-4 row-start-3 row-span-1 flex items-center px-4"
        >
          <p className="text-subheading text-[#6E6E73]">
            A new way to wear confidence—one tile at a time.
          </p>
        </div>

        {/* CTA Button */}
        <div className="col-start-5 col-span-3 row-start-5 row-span-1 flex items-end pb-4">
          <button 
            ref={ctaRef}
            onClick={scrollToShop}
            className="btn-pink flex items-center gap-2"
          >
            Explore the Collection
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
