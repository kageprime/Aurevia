import { DareToWearSection } from '@/sections/DareToWearSection';
import { AureviaSection } from '@/sections/AureviaSection';
import { BeautySection } from '@/sections/BeautySection';
import { DeconstructedSection } from '@/sections/DeconstructedSection';
import { ForEveryMoodSection } from '@/sections/ForEveryMoodSection';
import type { Product } from '@/types';

interface StoryPageProps {
  onAddToCart: (product: Product) => void;
}

export function StoryPage({ onAddToCart }: StoryPageProps) {
  return (
    <>
      <DareToWearSection />
      <AureviaSection onAddToCart={onAddToCart} />
      <BeautySection />
      <DeconstructedSection onAddToCart={onAddToCart} />
      <ForEveryMoodSection />
    </>
  );
}