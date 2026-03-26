export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'lip' | 'skincare';
  subcategory: string;
  image: string;
  description: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type FeaturedSectionKey =
  | 'story-aurevia'
  | 'story-deconstructed'
  | 'shop-lip'
  | 'shop-skincare';

export type FeaturedProductsBySection = Record<FeaturedSectionKey, Product[]>;

export interface CartItem extends Product {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
}
