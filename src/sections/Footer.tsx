import { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function Footer() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const newsletterRef = useRef<HTMLDivElement>(null);
  const footerLinksRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Newsletter reveal
      gsap.fromTo(newsletterRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: newsletterRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Footer links stagger
      const links = footerLinksRef.current?.querySelectorAll('a, p');
      if (links) {
        gsap.fromTo(links,
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            scrollTrigger: {
              trigger: footerLinksRef.current,
              start: 'top 90%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer 
      ref={sectionRef}
      className="relative bg-[#0B0B0D] text-white z-[90]"
    >
      {/* Newsletter Section */}
      <div 
        ref={newsletterRef}
        className="py-24 px-6 lg:px-12 border-b border-white/10"
      >
        <div className="max-w-2xl">
          <h2 
            className="text-heading font-bold mb-8"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Get the drops before they sell out.
          </h2>
          
          {subscribed ? (
            <p className="accent-text font-medium">
              Welcome to the inner circle. Check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none accent-focus-border"
                required
              />
              <button 
                type="submit"
                className="accent-bg text-white px-6 py-3 font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div 
        ref={footerLinksRef}
        className="py-12 px-6 lg:px-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Shop */}
          <div>
            <h4 className="font-mono text-xs tracking-mono uppercase mb-4 text-white/50">
              Shop
            </h4>
            <ul className="space-y-2">
              <li><Link to="/shop#shop-lip" className="text-sm accent-hover-text">Lip Color</Link></li>
              <li><Link to="/shop#shop-skincare" className="text-sm accent-hover-text">Skincare</Link></li>
              <li><Link to="/shop" className="text-sm accent-hover-text">Sets</Link></li>
              <li><Link to="/shop" className="text-sm accent-hover-text">Gift Cards</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-mono text-xs tracking-mono uppercase mb-4 text-white/50">
              Help
            </h4>
            <ul className="space-y-2">
              <li><a href="mailto:support@aurevia.com?subject=Shipping%20Question" className="text-sm accent-hover-text">Shipping</a></li>
              <li><a href="mailto:support@aurevia.com?subject=Returns%20Question" className="text-sm accent-hover-text">Returns</a></li>
              <li><Link to="/story" className="text-sm accent-hover-text">FAQ</Link></li>
              <li><a href="mailto:support@aurevia.com" className="text-sm accent-hover-text">Contact</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-mono text-xs tracking-mono uppercase mb-4 text-white/50">
              Follow
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-sm accent-hover-text flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              </li>
              <li><a href="https://tiktok.com" target="_blank" rel="noreferrer" className="text-sm accent-hover-text">TikTok</a></li>
              <li><a href="https://pinterest.com" target="_blank" rel="noreferrer" className="text-sm accent-hover-text">Pinterest</a></li>
            </ul>
          </div>

          {/* Brand */}
          <div>
            <h4 
              className="font-bold text-lg mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              AUREVIA
            </h4>
            <p className="text-sm text-white/50">
              Beauty, deconstructed.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/50">
            © Aurevia. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/story" className="text-xs text-white/50 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/story" className="text-xs text-white/50 hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
