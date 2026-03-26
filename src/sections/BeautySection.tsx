import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function BeautySection() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tileJRef = useRef<HTMLDivElement>(null);
  const tileKRef = useRef<HTMLDivElement>(null);
  const tileLRef = useRef<HTMLDivElement>(null);
  const pinkBlock7Ref = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

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
      scrollTl.fromTo(tileJRef.current,
        { x: '-70vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo([tileKRef.current, tileLRef.current],
        { x: '70vw', opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.03, ease: 'none' },
        0.05
      );

      // Headline characters
      const chars = headlineRef.current?.querySelectorAll('.char');
      if (chars) {
        scrollTl.fromTo(chars,
          { y: '40vh', opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.015, ease: 'none' },
          0.1
        );
      }

      scrollTl.fromTo(subheadlineRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.2
      );

      scrollTl.fromTo(pinkBlock7Ref.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'none' },
        0.22
      );

      scrollTl.fromTo(ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.25
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(headlineRef.current,
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0.25, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(subheadlineRef.current,
        { x: 0, opacity: 1 },
        { x: '12vw', opacity: 0.25, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(tileJRef.current,
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0.25, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo([tileKRef.current, tileLRef.current],
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0.25, stagger: 0.02, ease: 'power2.in' },
        0.74
      );

    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  const scrollToStory = () => {
    const element = document.getElementById('deconstructed-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="beauty-section"
      className="section-pinned bg-[#F6F6F2] z-40"
    >
      <div className="checkerboard-grid">
        {/* Tile J - Tall model portrait */}
        <div 
          ref={tileJRef}
          className="grid-tile col-start-1 col-span-5 row-start-1 row-span-6"
        >
          <img src="/beauty_model_tall.jpg" alt="Model portrait" className="object-top" />
        </div>

        {/* Tile K - Lips */}
        <div 
          ref={tileKRef}
          className="grid-tile col-start-10 col-span-3 row-start-1 row-span-3"
        >
          <img src="/hero_lips_closeup.jpg" alt="Lips" />
        </div>

        {/* Tile L - Eye */}
        <div 
          ref={tileLRef}
          className="grid-tile col-start-10 col-span-3 row-start-4 row-span-3"
        >
          <img src="/dare_eye.jpg" alt="Eye" />
        </div>

        {/* Pink Block P7 */}
        <div 
          ref={pinkBlock7Ref}
          className="pink-block col-start-9 col-span-2 row-start-5 row-span-2"
        />

        {/* Headline BEAUTY */}
        <div 
          ref={headlineRef}
          className="col-start-6 col-span-4 row-start-2 row-span-2 flex items-end"
        >
          <h2 className="text-display font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {'BEAUTY'.split('').map((char, i) => (
              <span key={i} className="char inline-block">{char}</span>
            ))}
          </h2>
        </div>

        {/* Subheadline */}
        <p 
          ref={subheadlineRef}
          className="col-start-6 col-span-4 row-start-4 row-span-1 flex items-center text-subheading text-[#6E6E73]"
        >
          is about being comfortable in your own skin.
        </p>

        {/* CTA */}
        <div className="col-start-6 col-span-3 row-start-5 row-span-1 flex items-start pt-4">
          <button 
            ref={ctaRef}
            onClick={scrollToStory}
            className="btn-pink-outline flex items-center gap-2"
          >
            Read Our Story
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
