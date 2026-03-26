import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from '@/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function ForEveryMoodSection() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const tilesRef = useRef<(HTMLDivElement | null)[]>([]);
  const pinkBlocksRef = useRef<(HTMLDivElement | null)[]>([]);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const microCopyRef = useRef<HTMLParagraphElement>(null);

  const portraits = [
    '/mood_portrait_1.jpg',
    '/mood_portrait_2.jpg',
    '/mood_portrait_3.jpg',
    '/mood_portrait_4.jpg',
    '/mood_portrait_5.jpg',
    '/mood_portrait_6.jpg',
    '/hero_model_portrait.jpg',
    '/aurevia_portrait.jpg'
  ];

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
      // Portrait tiles stagger from bottom
      tilesRef.current.forEach((tile, i) => {
        if (tile) {
          scrollTl.fromTo(tile,
            { y: '60vh', opacity: 0, rotation: -3 },
            { y: 0, opacity: 1, rotation: 0, ease: 'none' },
            i * 0.025
          );
        }
      });

      // Pink blocks scale in
      pinkBlocksRef.current.forEach((block, i) => {
        if (block) {
          scrollTl.fromTo(block,
            { scale: 0, rotation: -10, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, ease: 'none' },
            0.15 + i * 0.02
          );
        }
      });

      // Headline
      scrollTl.fromTo(headlineRef.current,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'none' },
        0.2
      );

      // Micro copy
      scrollTl.fromTo(microCopyRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, ease: 'none' },
        0.25
      );

      // EXIT (70% - 100%)
      scrollTl.fromTo(headlineRef.current,
        { y: 0, opacity: 1 },
        { y: '-18vh', opacity: 0.25, ease: 'power2.in' },
        0.7
      );

      // Tiles drift outward
      tilesRef.current.forEach((tile, i) => {
        if (tile) {
          const direction = i % 2 === 0 ? -1 : 1;
          scrollTl.fromTo(tile,
            { opacity: 1 },
            { x: `${direction * 15}vw`, opacity: 0.2, ease: 'power2.in' },
            0.72 + i * 0.01
          );
        }
      });

    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section 
      ref={sectionRef}
      className="section-pinned bg-[#F6F6F2] z-[60]"
    >
      <div className="checkerboard-grid">
        {/* 8 Portrait Tiles */}
        {portraits.map((src, i) => {
          const col = (i % 4) * 3 + 1;
          const row = Math.floor(i / 4) * 3 + 1;
          return (
            <div 
              key={i}
              ref={el => { tilesRef.current[i] = el; }}
              className={`grid-tile col-start-${col} col-span-3 row-start-${row} row-span-3`}
              style={{ 
                gridColumnStart: col, 
                gridColumnEnd: col + 3,
                gridRowStart: row,
                gridRowEnd: row + 3
              }}
            >
              <img src={src} alt={`Portrait ${i + 1}`} />
            </div>
          );
        })}

        {/* Pink Block P10 */}
        <div 
          ref={el => { pinkBlocksRef.current[0] = el; }}
          className="pink-block col-start-3 col-span-2 row-start-3 row-span-2"
        />

        {/* Pink Block P11 */}
        <div 
          ref={el => { pinkBlocksRef.current[1] = el; }}
          className="pink-block col-start-9 col-span-2 row-start-3 row-span-2"
        />

        {/* Headline - centered over grid */}
        <h2 
          ref={headlineRef}
          className="col-start-4 col-span-6 row-start-2 row-span-4 flex items-center justify-center text-display font-bold text-center"
          style={{ 
            fontFamily: 'Space Grotesk, sans-serif',
            textShadow: '2px 2px 0 #F6F6F2, -2px -2px 0 #F6F6F2, 2px -2px 0 #F6F6F2, -2px 2px 0 #F6F6F2'
          }}
        >
          FOR EVERY<br />MOOD
        </h2>

        {/* Micro copy */}
        <p 
          ref={microCopyRef}
          className="col-start-5 col-span-4 row-start-6 row-span-1 flex items-center justify-center font-mono text-xs tracking-mono uppercase text-[#6E6E73]"
        >
          Find your shade. Change your tone.
        </p>
      </div>
    </section>
  );
}
