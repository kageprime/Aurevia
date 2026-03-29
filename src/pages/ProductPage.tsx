import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { listProducts } from '@/lib/productsApi';
import { Button } from '@/components/ui/button';
import { FeaturedProductsCarousel } from '@/components/FeaturedProductsCarousel';

type ProductPageProps = {
  onAddToCart: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
};

export function ProductPage({ onAddToCart, onViewProduct }: ProductPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ productId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await listProducts(undefined, true);
        setProducts(data.filter((product) => product.isActive !== false));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load product.';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  const product = useMemo(
    () => products.find((item) => item.id === params.productId),
    [params.productId, products]
  );

  const relatedProducts = useMemo(
    () => {
      if (!product) {
        return [];
      }

      return products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
    },
    [product, products]
  );

  if (!isLoading && !product) {
    return <Navigate to="/shop" replace />;
  }

  const handleBuyNow = () => {
    onAddToCart(product as Product);
    navigate('/checkout/card');
  };

  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] pt-10 lg:pt-12 pb-20 px-4 sm:px-6 lg:px-12 min-h-screen">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-10 lg:space-y-12">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-[#0B0B0D]/10 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0B0B0D] hover:text-[#FF2D8F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center text-xs uppercase tracking-[0.24em] text-[#6E6E73]">
            Product view
          </div>
        </div>

        {!product ? (
          <div className="max-w-md bg-white border border-[#0B0B0D]/10 p-6 shadow-[0_18px_45px_rgba(11,11,13,0.06)]">
            <p className="text-[#6E6E73]">Loading product...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-stretch">
              <div className="h-full bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] overflow-hidden">
                <div className="aspect-[4/5] lg:aspect-[4/4.8] bg-[#F2F2EE] overflow-hidden h-full">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover grayscale-warm"
                  />
                </div>
              </div>

              <div className="h-full bg-white border border-[#0B0B0D]/10 shadow-[0_20px_60px_rgba(11,11,13,0.06)] p-6 lg:p-8 flex flex-col gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">
                    {product.category} · {product.subcategory}
                  </p>
                  <h1 className="text-3xl lg:text-5xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {product.name}
                  </h1>
                  <div className="mt-4 flex items-center gap-3 text-sm text-[#6E6E73]">
                    <BadgeCheck className="w-4 h-4 text-[#FF2D8F]" />
                    Elevated, clean, and built to sit inside the AUREVIA aesthetic.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#0B0B0D]/10 p-4 min-h-[104px] flex flex-col justify-between">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#6E6E73] mb-1">Price</p>
                    <p className="text-2xl font-bold">${product.price}</p>
                  </div>
                  <div className="border border-[#0B0B0D]/10 p-4 min-h-[104px] flex flex-col justify-between">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#6E6E73] mb-1">Category</p>
                    <p className="text-lg font-medium capitalize">{product.category}</p>
                  </div>
                </div>

                <p className="text-[#6E6E73] leading-7 border-y border-[#0B0B0D]/10 py-5">{product.description}</p>

                <div className="mt-auto space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={() => onAddToCart(product)}
                      className="w-full accent-bg hover:brightness-110 text-white rounded-none h-12 text-base"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to bag
                    </Button>
                    <Button
                      onClick={handleBuyNow}
                      className="w-full bg-[#0B0B0D] hover:bg-[#1B1B20] text-white rounded-none h-12 text-base"
                    >
                      Buy now
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate('/shop')}
                      className="border border-[#0B0B0D]/10 h-12 font-medium hover:border-[#0B0B0D] transition-colors"
                    >
                      Keep shopping
                    </button>
                    <button
                      onClick={() => onViewProduct?.(product)}
                      className="border border-[#0B0B0D]/10 h-12 font-medium hover:border-[#0B0B0D] transition-colors"
                    >
                      Share view
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)] items-stretch">
              <div className="h-full bg-[#0B0B0D] text-white p-6 lg:p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-white/50 mb-3">Why it fits</p>
                <ul className="space-y-3 text-sm text-white/85 leading-6">
                  <li>Designed to sit inside the same visual language as the editorial landing pages.</li>
                  <li>Built for quick add-to-bag checkout and a clearer shopping journey.</li>
                  <li>Matches the pink/black contrast that defines the brand system.</li>
                </ul>
              </div>

              <div className="h-full border border-[#0B0B0D]/10 bg-white p-6 lg:p-8 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Related products
                  </h2>
                  <Link to={`/shop#${product.category === 'lip' ? 'shop-lip' : 'shop-skincare'}`} className="text-sm accent-hover-text">
                    View section
                  </Link>
                </div>

                {relatedProducts.length > 0 ? (
                  <FeaturedProductsCarousel
                    products={relatedProducts}
                    onAddToCart={onAddToCart}
                    onViewProduct={(item) => navigate(`/product/${item.id}`)}
                    compact
                    className="w-full"
                  />
                ) : (
                  <p className="text-[#6E6E73]">No related products yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}