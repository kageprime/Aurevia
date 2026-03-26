import { LipColorShop } from '@/sections/LipColorShop';
import { SkincareShop } from '@/sections/SkincareShop';
import type { Product } from '@/types';

interface ShopPageProps {
  onAddToCart: (product: Product) => void;
}

export function ShopPage({ onAddToCart }: ShopPageProps) {
  return (
    <>
      <LipColorShop onAddToCart={onAddToCart} />
      <SkincareShop onAddToCart={onAddToCart} />
    </>
  );
}