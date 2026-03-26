import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function DareToWearSection() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tileERef = useRef<HTMLDivElement>(null);
  const tileFRef = useRef<HTMLDivElement>(null);
  const pinkBlock3Ref = useRef<HTMLDivElement>(null);
  const pinkBlock4Ref = useRef<HTMLDivElement>(null);
  const dareTextRef = useRef<HTMLDivElement>(null);
  const toWearTextRef = useRef<HTMLDivElement>(null);
  const microCopyRef = useRef<HTMLParagraphElement>(null);

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
      scrollTl.fromTo(tileERef.current,
        { x: '-60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(tileFRef.current,
        { x: '60vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(pinkBlock3Ref.current,
        { y: '40vh', scale: 0.9, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(pinkBlock4Ref.current,
        { y: '-30vh', scale: 0.9, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, ease: 'none' },
        0.05
      );

      // Letter tiles stagger in
      const dareLetters = dareTextRef.current?.querySelectorAll('.letter');
      const toWearLetters = toWearTextRef.current?.querySelectorAll('.letter');

      if (dareLetters) {
        scrollTl.fromTo(dareLetters,
          { y: '35vh', rotation: -6, opacity: 0 },
          { y: 0, rotation: 0, opacity: 1, stagger: 0.02, ease: 'none' },
          0.08
        );
      }

      if (toWearLetters) {
        scrollTl.fromTo(toWearLetters,
          { y: '35vh', rotation: -6, opacity: 0 },
          { y: 0, rotation: 0, opacity: 1, stagger: 0.02, ease: 'none' },
          0.12
        );
      }

      scrollTl.fromTo(microCopyRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.25
      );

      // EXIT (70% - 100%)
      if (dareLetters) {
        scrollTl.fromTo(dareLetters,
          { x: 0, opacity: 1 },
          { x: '-22vw', opacity: 0.25, stagger: 0.01, ease: 'power2.in' },
          0.7
        );
      }

      if (toWearLetters) {
        scrollTl.fromTo(toWearLetters,
          { x: 0, opacity: 1 },
          { x: '22vw', opacity: 0.25, stagger: 0.01, ease: 'power2.in' },
          0.7
        );
      }

      scrollTl.fromTo(tileERef.current,
        { x: 0, opacity: 1 },
        { x: '-40vw', opacity: 0.2, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(tileFRef.current,
        { x: 0, opacity: 1 },
        { x: '40vw', opacity: 0.2, ease: 'power2.in' },
        0.72
      );

    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section 
      ref={sectionRef}
      className="section-pinned bg-[#F6F6F2] z-20"
    >
      <div className="checkerboard-grid">
        {/* Tile E - Lips */}
        <div 
          ref={tileERef}
          className="grid-tile col-start-1 col-span-4 row-start-1 row-span-3"
        >
          <img src="/dare_lips.jpg" alt="Lips" />
        </div>

        {/* Tile F - Eye */}
        <div 
          ref={tileFRef}
          className="grid-tile col-start-9 col-span-4 row-start-4 row-span-3"
        >
          <img src="/dare_eye.jpg" alt="Eye" />
        </div>

        {/* Pink Block P3 */}
        <div 
          ref={pinkBlock3Ref}
          className="pink-block col-start-5 col-span-2 row-start-5 row-span-2"
        />

        {/* Pink Block P4 */}
        <div 
          ref={pinkBlock4Ref}
          className="pink-block col-start-11 col-span-2 row-start-1 row-span-1"
        />

        {/* DARE Text */}
        <div 
          ref={dareTextRef}
          className="col-start-5 col-span-6 row-start-1 row-span-3 flex items-center justify-center"
        >
          <div className="flex">
            {'DARE'.split('').map((letter, i) => (
              <span 
                key={i} 
                className="letter text-display font-bold"
                style={{ 
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(60px, 8vw, 120px)'
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* TO WEAR Text */}
        <div 
          ref={toWearTextRef}
          className="col-start-5 col-span-6 row-start-4 row-span-2 flex items-center justify-center"
        >
          <div className="flex">
            {'TO WEAR'.split('').map((letter, i) => (
              <span 
                key={i} 
                className={`letter text-display font-bold ${letter === 'E' && i === 4 ? 'accent-text' : ''}`}
                style={{ 
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: 'clamp(48px, 6vw, 100px)'
                }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </div>
        </div>

        {/* Micro copy */}
        <p 
          ref={microCopyRef}
          className="col-start-7 col-span-4 row-start-6 row-span-1 flex items-end pb-4 font-mono text-xs tracking-mono uppercase text-[#6E6E73]"
        >
          Longwear color. Zero apology.
        </p>
      </div>
    </section>
  );
}
