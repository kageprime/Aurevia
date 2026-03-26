import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HomeEditorialSection() {
  const navigate = useNavigate();

  return (
    <section className="section-pinned bg-[#F6F6F2] z-20">
      <div className="checkerboard-grid">
        <div className="grid-tile col-start-1 col-span-4 row-start-1 row-span-6">
          <img src="/beauty_model_tall.jpg" alt="Aurevia model portrait" className="object-top" />
        </div>

        <div className="grid-tile col-start-10 col-span-3 row-start-1 row-span-3">
          <img src="/aurevia_lips.jpg" alt="Aurevia lip detail" />
        </div>

        <div className="grid-tile col-start-10 col-span-3 row-start-4 row-span-3">
          <img src="/aurevia_eye.jpg" alt="Aurevia eye detail" />
        </div>

        <div className="pink-block col-start-8 col-span-2 row-start-5 row-span-2" />

        <div className="col-start-5 col-span-5 row-start-2 row-span-2 flex items-end">
          <h2 className="text-heading font-bold text-[#0B0B0D]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            WEAR YOUR
            <br />
            SIGNATURE
          </h2>
        </div>

        <p className="col-start-5 col-span-4 row-start-4 row-span-1 flex items-start text-subheading text-[#6E6E73]">
          Bold color, clean formulas, and skincare that keeps up.
        </p>

        <div className="col-start-5 col-span-5 row-start-5 row-span-1 flex items-start gap-4 pt-4">
          <button
            onClick={() => navigate('/shop#shop-lip')}
            className="btn-pink flex items-center gap-2"
          >
            Shop Bestsellers
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/story')}
            className="btn-pink-outline"
          >
            Read The Story
          </button>
        </div>
      </div>
    </section>
  );
}